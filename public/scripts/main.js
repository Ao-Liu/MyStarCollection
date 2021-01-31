var rhit = rhit || {};
rhit.BASE64 = null;
rhit.FB_KEY_USER = "User";
rhit.FB_KEY_USERNAME = "Username";
rhit.FB_KEY_PASSWORD = "Password";
rhit.curUser = null;

rhit.fbLoginManager = null;


//Util classes
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.base64 = class { // for encoding and decoding password
	constructor() {
		this.settings = {
			char: "+/",
			pad: "=",
			ascii: false
		};
		this.char_set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" + this.settings.char;
	}

	encode(g) {
		let a = "";
		let b = "";
		for (let d = 0; d < g.length; ++d) {
			let c = g.charCodeAt(d);
			if (this.settings.ascii) {
				if (c >= 256) {
					throw "Not an 8-bit char.";
				}
			}
			let e = c.toString(2);
			while (e.length < (this.settings.ascii ? 8 : 16)) {
				e = "0" + e;
			}
			b += e;
			while (b.length >= 6) {
				let f = b.slice(0, 6);
				b = b.slice(6);
				a += this.char_set.charAt(parseInt(f, 2))
			}
		}
		if (b) {
			while (b.length < 6) {
				b += "0";
			}
			a += this.char_set.charAt(parseInt(b, 2))
		}
		if (this.settings.pad) {
			while (a.length % (this.settings.ascii ? 4 : 8) != 0) {
				a += this.settings.pad;
			}
		}
		console.log("encoded password: ", a);
		return a;
	};

	decode(j) {
		let c = "";
		let b = "";
		let k = (this.settings.ascii ? 8 : 16);
		for (let f = 0; f < j.length; ++f) {
			if (j[f] == this.settings.pad) {
				break;
			}
			let a = this.char_set.indexOf(j.charAt(f));
			let h = a.toString(2);
			while (h.length < 6) {
				h = "0" + h;
			}
			b += h;
			while (b.length >= k) {
				let g = b.slice(0, k);
				b = b.slice(k);
				c += String.fromCharCode(parseInt(g, 2));
			}
		}
		let d = c.split("");
		let e = "";
		for (let f = 0; f < d.length; f++) {
			if (d[f].charCodeAt(0) > 20) {
				e += d[f];
			}
		}
		console.log("decoded password: ", e);
		return e;
	};
}


// Data model classes
rhit.User = class {
	constructor(username, password) {
		// , uid, email) {
		// this._uid = uid;
		this._username = username;
		this._password = password;
		// this._email = email;
		this._posts = [];
		this._following = [];
		this._collections = [];
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

//Page controller classes
rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#loginBtn").addEventListener("click", (event) => {
			const username = document.querySelector("#inputUsername").value;
			const password = document.querySelector("#inputPassword").value;
			if (username.includes(" ")) {
				alert("Username cannot contain space");
				return;
			}
			if (username == "" || password == "") {
				alert("Username and password cannot be empty");
				return;
			}
			let i = rhit.fbLoginManager.verifyUser(username);
			console.log(i);
			// console.log("username", user.get(rhit.FB_KEY_USERNAME));
			// console.log("passwd", user.get(rhit.FB_KEY_PASSWORD));
		});

		document.querySelector("#signupBtn").addEventListener("click", (event) => {
			console.log("signup btn onclick");
			const username = document.querySelector("#inputUsername").value;
			const password = document.querySelector("#inputPassword").value;
			const encodedPassword = rhit.BASE64.encode(password);
			if (username.includes(" ")) {
				alert("Username cannot contain space");
				return;
			}
			if (username == "" || password == "") {
				alert("Username and password cannot be empty");
				return;
			}
			rhit.fbLoginManager.add(username, encodedPassword);
		});
	}
}

// Firebase manager classes
rhit.FbLoginManager = class {
	constructor() {
		console.log("fbLoginManager created");
		this._ref = firebase.firestore().collection(rhit.FB_KEY_USER);
	}

	add(username, password) {
		this._ref.add({
				[rhit.FB_KEY_USERNAME]: username,
				[rhit.FB_KEY_PASSWORD]: password,
			})
			.then(function (docRef) {
				console.log("doc id: ", docRef.id);
			})
			.catch(function (error) {
				console.log(error);
			});
	}

	//TODO 
	verifyUser(username) {
		let doc1 = null;
		this._ref.where("Username", "==", username).onSnapshot((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				console.log(doc.data().Username);
				doc1 = doc;
			});
			return new rhit.User(doc.data().Username, doc.data().Password);
		});
		return doc1;
	}
}

rhit.main = function () {
	console.log("Ready");
	this.BASE64 = new rhit.base64;

	if (document.querySelector("#loginPage")) {
		console.log("You are on login page");
		rhit.fbLoginManager = new rhit.FbLoginManager();
		new rhit.LoginPageController();
	}
};

rhit.main();