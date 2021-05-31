import numpy as np
import re
from nltk.tokenize import word_tokenize
import nltk
from nltk.corpus import stopwords
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity


data = pd.read_csv('../src/database/final_perfume_data.csv', encoding='latin-1')

try:
    stop_word = stopwords.words('english')
except:
    nltk.download('stopwords')
    nltk.download('punkt')
    stop_word = stopwords.words('english')

# preprocessing of description
data['clean_docs'] = data['Description'].str.replace(r'[^a-zA-Z]', ' ')
data['clean_docs'] = data['clean_docs'].str.lower()
data['clean_docs'] = data['clean_docs'].apply(lambda x: [w for w in word_tokenize(x) if w not in stop_word and len(w)>2])

# remove empty row
data['clean_docs'].replace('', np.nan, inplace=True)
data = data[data['clean_docs'].notna()]

from gensim.models import KeyedVectors
# load model
w2v_model = KeyedVectors.load_word2vec_format('../src/pretrained_models/perfume_w2v')
print(w2v_model.most_similar('citrus'))     # to check loaded properly


def avg_vector(tokens):
    """
    get average w2v vectors for all tokens in the token list
    :param tokens: list of words
    :return: average vector
    """
    tok2vec = [w2v_model[token] for token in tokens if token in w2v_model.key_to_index]
    mean_vector = np.mean(tok2vec, axis=0) if tok2vec else None
    return mean_vector


def doc2vectors(doc_list):
    """
    get average document vectors in the document list
    :param doc_list: list of word lists
    :return: list of average vector of documents
    """
    doc_embedding_list = [avg_vector(doc) for doc in doc_list]
    return doc_embedding_list


def doc_embedd(doc_list):
    """
    get list of document vectors and index to document number list
    :param doc_list:
    :return:
    """
    doc_embedded_list = []
    simidx_doc = []
    for doc_num, vec in enumerate(doc2vectors(doc_list)):
        if vec is not None:
            doc_embedded_list.append(vec)
            simidx_doc.append(doc_num)

    return np.array(doc_embedded_list), np.array(simidx_doc)

def user_input_preprocessing(user_input):
    res = re.sub('[^a-zA-Z]', ' ', user_input)
    res = [w for w in word_tokenize(res.lower())
           if w not in stop_word and len(w)>2]

    return res

doc_embedded_list, simidx_docnum = doc_embedd(data['clean_docs'])

def recommendation(user_input, doc_embedded_list, top=5):
    """
    return doc idx, similarity by descending order of top n th
    :param user_input:
    :param doc_embedded_list:
    :param top:
    :return:
    """
    user_vec = avg_vector(user_input_preprocessing(user_input))
    sim = cosine_similarity([user_vec], doc_embedded_list)
    sorted_args = np.argsort(sim[0])[::-1]
    sorted_args = sorted_args[:top]
    return list(zip(sorted_args, sim[0, sorted_args]))

def __test():
    user_input = "It would be nice to have a refreshing scent like orange and a cool scent like the sea."
    user_input2 = "Passionate about native flora, Thays created unique parks. We have imagined the improbable encounters of multiple odors in his enchanting gardens."

    user_vec = user_input_preprocessing(user_input)
    user_vec2 = user_input_preprocessing(user_input2)

    user_vec = avg_vector(user_vec)
    user_vec2 = avg_vector(user_vec2)

    doc_embedded_list, simidx_docnum = doc_embedd(data['clean_docs'])
    cos_sin = cosine_similarity(doc_embedded_list, doc_embedded_list) #doc similarities

    recommended = recommendation(user_input2, doc_embedded_list)

    indecies = [simidx_docnum[r[0]] for r in recommended]
    print(user_input2)
    print(data[['Description', 'Notes']].loc[indecies])


    recommended2 = recommendation(user_input, doc_embedded_list)
    indecies = [simidx_docnum[r[0]] for r in recommended2]
    print(user_input)
    print(data[['Description', 'Notes']].loc[indecies])

__test()

