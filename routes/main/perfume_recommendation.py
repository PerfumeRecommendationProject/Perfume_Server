import argparse
import numpy as np
import re
import pandas as pd

from pprint import pprint
from sklearn.metrics.pairwise import cosine_similarity
from gensim.models import KeyedVectors
from tensorflow.python.keras.preprocessing.text import text_to_word_sequence
import sys

def save_params():
    # data = pd.read_csv('../src/database/final_perfume_data_clean_with_clean_docs.csv')
    data = pd.read_csv('/home/ubuntu/perfume_PJ/routes/src/database/final_perfume_data_clean_with_clean_docs.csv')
    data['clean_docs'] = data['clean_docs'].apply(lambda x: x.split('#'))
    doc_embedded_list, simidx_docnum = doc_embedding(data['clean_docs'].to_list())
    np.save('doc_embedded_list', doc_embedded_list)
    np.save('simidx_docnum', simidx_docnum)

def save_existing():
    doc_embedded_list = np.load('/home/ubuntu/perfume_PJ/routes/src/database/doc_embedded_list.npy')
    simidx_docnum = np.load('/home/ubuntu/perfume_PJ/routes/src/database/simidx_docnum.npy')
    # doc_embedded_list = np.load('../src/database/doc_embedded_list.npy')
    # simidx_docnum = np.load('../src/database/simidx_docnum.npy')
    cos_sim = cosine_similarity(doc_embedded_list, doc_embedded_list)
    sim_args = np.argsort(cos_sim, axis=1)[:, -2:-5:-1]
    sim_args = [[simidx_docnum[a] for a in args] for args in sim_args]
    data = pd.DataFrame(sim_args, columns=['recommendation1','recommendation2','recommendation3'])
    data.to_csv('/home/ubuntu/perfume_PJ/routes/src/database/existing_recommendation.csv', index=False)
    # data.to_csv('../src/database/existing_recommendation.csv', index=False)


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


def doc_embedding(doc_list):
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
    res = re.sub("[^a-zA-Z']", ' ', user_input)
    res = re.sub("'[a-su-zA-SU-Z]", ' ',res)
    res = text_to_word_sequence(res)
    return res

def recommendation(user_input, doc_embedded_list, simidx_docnum, top=3):
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
    sorted_args = [simidx_docnum[i] for i in sorted_args[:top]]

    return list(zip(sorted_args, sim[0, sorted_args]))


def create_parser():
    parser = argparse.ArgumentParser(description='Perfume recommendation type')
    parser.add_argument('user_input', type=str)
    return parser


if __name__ == '__main__':
    parser = create_parser()
    args = parser.parse_args()

    w2v_model = KeyedVectors.load_word2vec_format('/home/ubuntu/perfume_PJ/routes/src/pretrained_models/perfume_w2v')
    doc_embedded_list = np.load('/home/ubuntu/perfume_PJ/routes/src/database/doc_embedded_list.npy')
    simidx_docnum = np.load('/home/ubuntu/perfume_PJ/routes/src/database/simidx_docnum.npy')
    # w2v_model = KeyedVectors.load_word2vec_format('../src/pretrained_models/perfume_w2v')
    # doc_embedded_list = np.load('../src/database/doc_embedded_list.npy')
    # simidx_docnum = np.load('../src/database/simidx_docnum.npy')
    user_input = sys.argv[1]
    #print(user_input)
    pprint(dict(recommendation(user_input, doc_embedded_list, simidx_docnum)))
    #print("in python code")

