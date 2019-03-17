from flask import Flask, Response, jsonify, request, send_file
from github import Github

app = Flask(__name__)
g = Github(os.environ['GH_USER'],os.environ['GH_PWD'])
repo = g.get_repo("skiturer-norge/skiturer-norge.github.io")

@app.route('api/skiturer-norge/route',methods=['POST'])
def apiHandler():
    post = loads(request.data)
    fileSaveName = ''.join([i if i.isalnum() else '_' for i in post['name']])
    fileName = fileSaveName+'-'+os.urandom(3).hex()+'.gpx'
    path = os.path.join('ruter/user/',fileName)
    repo.create_file(path,'new route (web)',post['gpx'])
    routes = repo.get_contents('ruter/user_onload.txt')
    new_content = routes.content+'\n'+fileName
    repo.update_file(routes.path,'new route to list (web)',new_content,routes.sha)
    return Response(200)

if __name__=='__main__':
    app.run(port=8000)
