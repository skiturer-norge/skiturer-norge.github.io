from flask import Flask, Response, jsonify, request, send_file
from github import Github, InputFileContent

app = Flask(__name__)
g = Github(os.environ['GH_USER'],os.environ['GH_PWD'])
repo = g.get_repo("skiturer-norge/skiturer-norge.github.io")

@app.route('/api/skiturer-norge/route',methods=['POST'])
def apiHandler():
    post = loads(request.data)
    content = InputFileContent(post['gpx'])
    gist = g.create_gist(True,{post['name']: content})
    url = gist.files[post['name']].raw_url
    
    return Response(200)

if __name__=='__main__':
    app.run(port=8000)
