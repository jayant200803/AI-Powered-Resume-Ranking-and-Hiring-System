#!/usr/bin/env bash
set -e

pip install -r requirements.txt

python -c "
import nltk
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')
nltk.download('punkt')
print('NLTK data ready')
"
