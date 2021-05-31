import pandas as pd
import numpy as np
import re
import nltk
from nltk.corpus import stopwords


data = pd.read_csv('../src/database/final_perfume_data_clean.csv')

try:
    stopword = stopwords.words('english')
except:
    nltk.download('stopwords')
    nltk.download('punkt')
    stopword = stopwords.words('english')

x = ' '.join(stopword)
nt = re.findall("\w+'t", x)
stopword = set(stopword) - ({'no', 'nor', 'not', 'only', 'too'}| set(nt))

# preprocessing of description
data['clean_docs'] = data['Description'].str.replace("[^a-zA-Z']", ' ')
data['clean_docs'] = data['clean_docs'].str.replace("'[a-su-zA-SU-Z]", ' ')
data['clean_docs'] = data['clean_docs'].str.replace(' +', ' ')
data['clean_docs'] = data['clean_docs'].str.lower()

from tensorflow.python.keras.preprocessing.text import text_to_word_sequence
data['clean_docs'] = data['clean_docs'].apply(lambda x: [t for t in text_to_word_sequence(x)
                                                         if t not in stopword and len(t)>1])

# remove empty row
data['clean_docs'].replace('', np.nan, inplace=True)
data = data[data['clean_docs'].notna()]

# concatenating all clean docs
data['clean_docs'] = data['clean_docs'].apply('#'.join)

data.to_csv('../src/database/final_perfume_data_clean_with_clean_docs.csv', index=False)