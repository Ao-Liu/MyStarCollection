var rhit = rhit || {};
rhit.BASE64 = null;
rhit.FB_KEY_USER = "User";
rhit.FB_KEY_USERNAME = "Username";
rhit.FB_KEY_PASSWORD = "Password";
rhit.CURRENT_USER = null;

rhit.fbUserManager = null;


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
	// constructor(username, password) {
	// 	// , uid, email) {
	// 	// this._uid = uid;
	// 	this._username = username;
	// 	this._password = password;
	// 	// this._email = email;
	// 	this._posts = [];
	// 	this._following = [];
	// 	this._collections = [];
	constructor() {
		console.log("user created");
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

// Firebase manager classes
rhit.FbUserManager = class {
	constructor() {
		console.log("fbUserManager created");
		this._documentSnapshots = [];
		this._unsusubscribe = null;
		this._data = null;
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
}

rhit.initUserAuth = function () {
	firebase.auth().onAuthStateChanged((user) => {
		if (user) {
			const uid = user.uid;
			const displayName = user.displayName;
			const email = user.email;
			const photoURL = user.photoURL;
			const isAnonymous = user.isAnonymous;
			const phoneNumber = user.phoneNumber;
			console.log("user is signed in", uid);
			console.log('email :>> ', email);
			console.log('displayName :>> ', displayName);
			console.log('photoURL :>> ', photoURL);
			console.log('isAnonymous :>> ', isAnonymous);
			console.log('phoneNumber :>> ', phoneNumber);
		} else {
			console.log("there is no user signed in");
		}
	});
	const inputEmailEl = document.querySelector("#emailInput");
	const inputPasswordEl = document.querySelector("#pwInput");

	document.querySelector("#signupBtn").onclick = (event) => {
		console.log(`Create account for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);
		firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).then((params) => {
				alert("Welcome to MyStarCollection!");
			})
			.catch((error) => {
				var errorCode = error.code;
				var errorMessage = error.message;
				console.log("create account error", errorCode, errorMessage);
				switch (errorCode) {
					case "auth/invalid-email":
						alert("The email address is badly formatted");
						break;
					case "auth/weak-password":
						alert("Password should be at least 6 characters");
						break;
					default:
						alert("An error occured");
						break;
				}
				return;
			});
	};

	document.querySelector("#loginBtn").onclick = (event) => {
		$('#alertInvalidEmail').hide();
		console.log(`Log in for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);
		firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
			.catch((error) => {
				var errorCode = error.code;
				var errorMessage = error.message;
				console.log("log in error", errorCode, errorMessage);
				switch (errorCode) {
					case "auth/wrong-password":
						alert("Email and password doesn't match");
						break;
					case "auth/user-not-found":
						alert("No such user");
						break;
					default:
						alert("An error occured");
						break;
				}
				return;
			});
	};
}

rhit.initPage = function () {
	// login page
	if (document.querySelector("#loginPage")) {
		console.log("You are on login page");
		// rhit.fbUserManager = new rhit.FbUserManager();
		rhit.initUserAuth();
	}
}

rhit.main = function () {
	console.log("Ready");
	this.BASE64 = new rhit.base64;
	rhit.initPage();
};

rhit.main();