var rhit = rhit || {};

rhit.ClassName = class {
	constructor() {

	}

	methodName() {

	}
}

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.Comment = class {
	constructor(cid, commentBy, comment) {
		this._cid = cid;
		this._commentBy = commentBy;
		this._comment = comment;
	}

	get commentBy() {
		return this._commentBy;
	}

	get comment() {
		return this._comment;
	}
}

rhit.User = class {
	constructor(uid, username, password, email) {
		this._uid = uid;
		this._username = username;
		this._password = password;
		this._email = email;
		this._posts = [];
		this._following = [];
		this._collections = [];
		this.parsePassword(password);
	}
}

rhit.Post = class {
	constructor(pid, postBy, pic, title, des) {
		this._pid = pid;
		this._postBy = postBy;
		this._pic = pic;
		this._title = title;
		this._des = des;
		this._likedBy = [];
		this._savedBy = [];
		this._comments = [];
	}
}

rhit.main = function () {
	console.log("Ready");
};

rhit.main();
