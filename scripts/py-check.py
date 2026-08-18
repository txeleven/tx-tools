# -*- coding: utf-8 -*-
import sys, importlib.util, base64

spec = importlib.util.spec_from_file_location('cc', 'src/tools/cryptoCode.js')
# 直接读取 JS 文件中 Python 代码段不可行，这里改为从 JS 文件提取后由 node 吐出
# 改为：读取 node 生成的 py 代码文件
sys.path.insert(0, 'scripts')
code = open('scripts/py_extract.py', 'r', encoding='utf-8').read()
ns = {}
exec(compile(code, 'py_extract.py', 'exec'), ns)

TEXT = '你好 world 🎉'
KEY = 'my-secret-key'
KEY16 = '1234567890123456'

for algo in ('xor', 'rc4'):
    enc = ns[algo + '_enc']
    dec = ns[algo + '_dec']
    c = enc(TEXT, KEY)
    d = dec(c, KEY)
    print(algo, '自洽:', d == TEXT and isinstance(c, str) and c != '' and 'OK' or 'FAIL')

# 与 JS 工具加密结果互通：由 node 生成密文
import subprocess, json
out = subprocess.run(['node', 'scripts/gen_py_ciphers.mjs'], capture_output=True, text=True)
data = json.loads(out.stdout)
for algo in ('xor', 'rc4'):
    mine = data[algo]
    dec = ns[algo + '_dec']
    print(algo, 'node密文->py解密:', dec(mine, KEY) == TEXT and 'OK' or 'FAIL')
    enc = ns[algo + '_enc']
    print(algo, 'py加密->node解密:', data[algo + '_node_dec'](enc(TEXT, KEY)) == TEXT and 'OK' or 'FAIL')

aes_enc = ns['aes_enc']
aes_dec = ns['aes_dec']
c = aes_enc(TEXT, KEY16)
print('aes 自洽:', aes_dec(c, KEY16) == TEXT and 'OK' or 'FAIL')
print('aes node密文->py解密:', aes_dec(data['aes'], KEY16) == TEXT and 'OK' or 'FAIL')
