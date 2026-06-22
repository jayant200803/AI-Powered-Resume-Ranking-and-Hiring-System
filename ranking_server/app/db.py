# app/db.py
from pymongo import MongoClient, ASCENDING
from bson import ObjectId
from typing import List
from .config import MONGODB_URI, MONGODB_DB


_client = MongoClient(MONGODB_URI)

def get_db():
    return _client[MONGODB_DB]


def fetch_job_and_applicants(job_id: str):
    """
    Fetches job details and all applicants for a given job_id (MongoDB ObjectId string).
    Returns (job_dict, list_of_app_dicts) matching the shape routes.py expects.
    """
    db = get_db()

    try:
        job_oid = ObjectId(job_id)
    except Exception:
        return None, []

    # Fetch the job document
    job_doc = db["jobs"].find_one(
        {"_id": job_oid},
        {"job_title": 1, "job_description": 1, "job_role": 1}
    )
    if not job_doc:
        return None, []

    job = {
        "job_title": job_doc.get("job_title", ""),
        "job_description": job_doc.get("job_description", ""),
        "job_role": job_doc.get("job_role", ""),
    }

    # Fetch all applications for this job, sorted by rank ascending
    app_docs = list(db["applications"].find(
        {"jobId": job_oid},
        sort=[("rank", ASCENDING)]
    ))

    if not app_docs:
        return job, []

    # Batch-fetch all jobseeker documents
    seeker_oids = [doc["jobSeekerId"] for doc in app_docs]
    seeker_docs = db["jobseekers"].find({"_id": {"$in": seeker_oids}})
    seeker_map = {doc["_id"]: doc for doc in seeker_docs}

    result = []
    for app_doc in app_docs:
        sid = app_doc["jobSeekerId"]
        seeker = seeker_map.get(sid, {})
        resume_data_raw = seeker.get("resume_data")

        # Convert BSON Binary / memoryview to plain bytes
        if resume_data_raw is not None:
            if hasattr(resume_data_raw, "tobytes"):
                resume_bytes = resume_data_raw.tobytes()
            else:
                resume_bytes = bytes(resume_data_raw)
        else:
            resume_bytes = None

        result.append({
            "application_id": str(app_doc["_id"]),
            "job_seeker_id": str(sid),          # string ObjectId
            "name": seeker.get("name", ""),
            "degree": seeker.get("degree", ""),
            "college": seeker.get("college", ""),
            "graduation_year": seeker.get("graduation_year"),
            "resume_name": seeker.get("resume_name", ""),
            "resume_data": resume_bytes,
            "rank": app_doc.get("rank", 0),
        })

    return job, result


def update_ranks(job_id: str, ordered_job_seeker_ids: List[str]):
    """
    Resets all ranks for a job to 0, then assigns rank 1, 2, 3... to each seeker in order.
    ordered_job_seeker_ids: list of string ObjectIds, best-ranked first.
    """
    db = get_db()

    try:
        job_oid = ObjectId(job_id)
    except Exception:
        return

    # Reset all ranks for this job
    db["applications"].update_many(
        {"jobId": job_oid},
        {"$set": {"rank": 0}}
    )

    # Assign individual ranks
    for idx, jsid_str in enumerate(ordered_job_seeker_ids, start=1):
        try:
            seeker_oid = ObjectId(jsid_str)
        except Exception:
            continue
        db["applications"].update_one(
            {"jobId": job_oid, "jobSeekerId": seeker_oid},
            {"$set": {"rank": idx}}
        )
