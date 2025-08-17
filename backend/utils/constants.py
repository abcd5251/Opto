COLLECTION_NAME = "DeFi_Knowledge"
EMBEDDING_MODEL = "text-embedding-3-small"
FILE_PATH = "./data/information.txt"

file_path = FILE_PATH 

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
CONTENT = content