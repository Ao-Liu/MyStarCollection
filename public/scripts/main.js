var rhit = rhit || {};
rhit.BASE64 = null;
rhit.FB_KEY_USER = "User";
rhit.FB_KEY_USERNAME = "Username";
rhit.FB_KEY_PASSWORD = "Password";
rhit.CURRENT_USER = null;

rhit.fbAuthManager = null;


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

// Firebase manager classes
rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
		console.log("You have created fbAuthManager");
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signIn() {
		Rosefire.signIn("dd1837bc-1867-4576-9f8f-240dab5f4940", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);
			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode == 'auth/invalid-custom-token') {
					alert("invalild token");
				} else {
					console.error("auth error", errorCode, errorMessage);
				}
			});
			console.log(`isSingedIn: ${rhit.fbAuthManager.isSignedIn}`);
		});
	}

	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("sign out error");
		});
	}

	get isSignedIn() {
		return !!this._user;
	}

	get uid() {
		return this._user.uid;
	}
}

//Page controller classes
rhit.LoginPageController = class {
	constructor() {
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

		document.querySelector("#registerBtn").onclick = (event) => {
			window.location.href = "/signup.html";
			sessionStorage.setItem("TMP_EMAIL", inputEmailEl.value);
			sessionStorage.setItem("TMP_PW", inputPasswordEl.value);
		};

		document.querySelector("#forgetPwBtn").onclick = (event) => {
			window.location.href = "/resetpassword.html";
		}

		document.querySelector("#loginBtn").onclick = (event) => {
			console.log(`Log in for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);
			firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
				.then((event) => {
					alert("Welcome Back!")
					window.location.href = "/main.html";
				}).catch((error) => {
					let errorCode = error.code;
					let errorMessage = error.message;
					console.log("log in error", errorCode, errorMessage);
					switch (errorCode) {
						case "auth/invalid-email":
							alert("The email address is badly formatted");
							break;
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
}

rhit.SignUpPageController = class {
	constructor() {
		document.querySelector("#emailInput").value = sessionStorage.getItem("TMP_EMAIL");
		document.querySelector("#pwInput").value = sessionStorage.getItem("TMP_PW");
		sessionStorage.removeItem("TMP_EMAIL");
		sessionStorage.removeItem("TMP_PW");
		const inputEmailEl = document.querySelector("#emailInput");
		const inputPasswordEl = document.querySelector("#pwInput");
		const inputUsernameEl = document.querySelector("#usernameInput");
		document.querySelector("#signupBtn").onclick = (event) => {
			if (inputUsernameEl.value == "" || inputUsernameEl.value.includes(" ")) {
				alert("Username not valid");
				return;
			}
			console.log(`Create account for email: ${inputEmailEl.value} password: ${inputPasswordEl.value} username: ${inputUsernameEl.value}`);
			firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).then((params) => {
					alert("Welcome to MyStarCollection!");
					var user = firebase.auth().currentUser;
					user.updateProfile({
						displayName: `@${inputUsernameEl.value}`
					}).then(function () {
						console.log("new username: ", user.displayName);
					}).catch(function (error) {
						console.log(error);
						switch (error) {
							default:
								alert("An error occured");
								break;
						}
						return;
					});
					window.location.href = "/welcome.html";
				})
				.catch((error) => {
					let errorCode = error.code;
					let errorMessage = error.message;
					console.log("create account error", errorCode, errorMessage);
					switch (errorCode) {
						case "auth/invalid-email":
							alert("The email address is badly formatted");
							break;
						case "auth/weak-password":
							alert("Password should be at least 6 characters");
							break;
						case "auth/email-already-in-use":
							alert("This email has already been registered");
							break;
						default:
							alert("An error occured");
							break;
					}
					return;
				});
		};
	}
}

rhit.ResetPwPageController = class {
	constructor() {
		const inputEmailEl = document.querySelector("#emailInput");
		document.querySelector("#signupBtn").onclick = (event) => {
			console.log(`Reset password for email: ${inputEmailEl.value}`);
			firebase.auth().sendPasswordResetEmail(
					inputEmailEl.value)
				.then(function () {
					console.log("verification sent");
					alert("Please check your email for reset password link")
				})
				.catch(function (error) {
					console.log(error);
					let errorCode = error.code;
					switch (errorCode) {
						case "auth/invalid-email":
							alert("The email address is badly formatted");
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
		}
	}
}

rhit.WelcomePageController = class {
	constructor() {
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
		let user = firebase.auth().currentUser;
		document.querySelector("#username").innerHTML = user.displayName;

		document.querySelector("#liftOffBtn").onclick = (event) => {
			window.location.href = "/main.html";
		}
	}
}

rhit.MainPageController = class {
	constructor() {
		document.querySelector("#likeBtn").onclick = (event) => {
			const color = document.querySelector("#likeBtn").style.color;
			if (color == "rgb(204, 0, 10)") {
				document.querySelector("#likeBtn").style.color = "#555";
			} else {
				document.querySelector("#likeBtn").style.color = "#CC000A";
			}
			console.log(color);
		}

		document.querySelector("#saveBtn").onclick = (event) => {
			const color = document.querySelector("#saveBtn").style.color;
			if (color == "rgb(242, 232, 34)") {
				document.querySelector("#saveBtn").style.color = "#555";
			} else {
				document.querySelector("#saveBtn").style.color = "#F2E822";
			}
			console.log(color);
		}

		document.querySelector("#followUser").onclick = (event) => {
			let e = document.getElementById('followUser');
			let author = document.querySelector("#author").innerHTML;
			author = author.replace("&nbsp;&nbsp;", "");
			console.log(author);
			if (e.classList.contains('fa-user-plus')) {
				console.log(document.querySelector("#author").innerHTML);
				e.classList.remove('fa-user-plus');
				e.classList.add('fa-user-check');
				alert(`You are now following ${author}`);
			} else {
				e.classList.remove('fa-user-check');
				e.classList.add('fa-user-plus');
				alert(`You have unfollowed ${author}`);
			}
		}

		document.querySelector("#commentBtn").onclick = (event) => {
			// TODO: storageSession pass in save and like state
			window.location.href = "/comment.html";
		}

		document.querySelector("#personalBtn").onclick = (event) => {
			window.location.href = "/personal.html";
		}

		document.querySelector("#shareBtn").onclick = (event) => {
			window.location.href = "/share.html";
		}
	}
}

function createCard(comment) {
	var user = firebase.auth().currentUser;
	return htmlToElement(`<h5>${user.displayName}: ${comment}</h5>`);
}

rhit.CommentPageController = class {
	constructor() {
		this._comments = [];

		document.querySelector("#likeBtn").onclick = (event) => {
			const color = document.querySelector("#likeBtn").style.color;
			if (color == "rgb(204, 0, 10)") {
				document.querySelector("#likeBtn").style.color = "#555";
			} else {
				document.querySelector("#likeBtn").style.color = "#CC000A";
			}
			console.log(color);
		}

		document.querySelector("#saveBtn").onclick = (event) => {
			const color = document.querySelector("#saveBtn").style.color;
			if (color == "rgb(242, 232, 34)") {
				document.querySelector("#saveBtn").style.color = "#555";
			} else {
				document.querySelector("#saveBtn").style.color = "#F2E822";
			}
			console.log(color);
		}

		document.querySelector("#backBtn").onclick = (event) => {
			// TODO: storageSession pass in save and like state
			window.location.href = "/main.html";
		}

		document.querySelector("#submitAddComment").onclick = (event) => {
			// TODO: firebase add
			const comment = document.querySelector("#inputComment").value;
			console.log(`comment = ${comment}`);
			const newList = htmlToElement('<div id="commentContainer"></div>');
			const newCard = createCard(comment);
			newList.append(newCard);
			const oldList = document.querySelector("#commentContainer");
			oldList.removeAttribute("id");
			oldList.hidden = true;
			oldList.parentElement.append(newList);
		}
	}
}

rhit.PersonalPageController = class {
	constructor() {
		document.querySelector("#username").innerHTML = firebase.auth().currentUser.displayName;

		document.querySelector("#profileBtn").onclick = (event) => {
			window.location.href = "/update.html";
		}

		document.querySelector("#backBtn").onclick = (event) => {
			window.location.href = "/main.html";
		}

		document.querySelector("#myPostsBtn").onclick = (event) => {
			window.location.href = "/myposts.html";
		}

		document.querySelector("#followingBtn").onclick = (event) => {
			// window.location.href = "/following.html";
			window.location.href = "/otheruser.html";
		}
	}
}

rhit.UpdatePageController = class {
	constructor() {
		const inputEmailEl = document.querySelector("#emailInput");
		const inputPasswordEl = document.querySelector("#pwInput");
		const inputUsernameEl = document.querySelector("#usernameInput");

		document.querySelector("#backBtn").onclick = (event) => {
			window.location.href = "/personal.html";
		}

		document.querySelector("#updateBtn").onclick = (event) => {
			var user = firebase.auth().currentUser;
			//update email
			if (inputEmailEl.value == user.email) {
				alert("This is current Email");
			} else if (inputEmailEl.value != "") {
				user.updateEmail(inputEmailEl.value).then(function () {
					alert("Email updated");
				}).catch(function (error) {
					let errorCode = error.code;
					let errorMessage = error.message;
					console.log("create account error", errorCode, errorMessage);
					switch (errorCode) {
						case "auth/invalid-email":
							alert("The email address is badly formatted");
							break;
						case "auth/weak-password":
							alert("Password should be at least 6 characters");
							break;
						case "auth/email-already-in-use":
							alert("This email has already been registered");
							break;
						case "auth/requires-recent-login":
							alert("This operation is sensitive and requires recent Login again before retrying this request");
							break;
						default:
							alert("An error occured");
							break;
					}
					return;
				});
			}

			//update password
			if (inputPasswordEl.value != "") {
				user.updatePassword(inputPasswordEl.value).then(function () {
					alert("password updated");
				}).catch(function (error) {
					let errorCode = error.code;
					let errorMessage = error.message;
					switch (errorCode) {
						case "auth/invalid-email":
							alert("The email address is badly formatted");
							break;
						case "auth/weak-password":
							alert("Password should be at least 6 characters");
							break;
						case "auth/email-already-in-use":
							alert("This email has already been registered");
							break;
						case "auth/requires-recent-login":
							alert("This operation is sensitive and requires recent Login again before retrying this request");
							break;
						default:
							alert("An error occured");
							break;
					}
					return;
				});
			}

			//update username
			if (`@${inputUsernameEl.value}` == user.displayName) {
				alert("This is current Username");
			} else if (inputUsernameEl.value.includes(" ")) {
				alert("Username not valid");
			} else if (inputUsernameEl.value == "") {} else {
				user.updateProfile({
					displayName: `@${inputUsernameEl.value}`
				}).then(function () {
					alert("Username updated");
					console.log("new username: ", user.displayName);
				}).catch(function (error) {
					console.log(error);
					switch (error) {
						default:
							alert("An error occured");
							break;
					}
					return;
				});
			}

			document.querySelector("#emailInput").value = "";
			document.querySelector("#pwInput").value = "";
			document.querySelector("#usernameInput").value = "";
		}
	}
}

rhit.FollowingPageController = class {
	constructor() {
		document.querySelector("#backBtn").onclick = (event) => {
			window.location.href = "/personal.html";
		}
	}
}


rhit.SharePageController = class {
	constructor() {
		document.querySelector("#backBtn").onclick = (event) => {
			window.location.href = "/main.html";
		}
	}
}

rhit.MyPostsPageController = class {
	constructor() {
		document.querySelector("#backBtn").onclick = (event) => {
			window.location.href = "/personal.html";
		}
	}
}

rhit.OtherUserPageController = class {
	constructor() {
		document.querySelector("#backBtn").onclick = (event) => {
			window.location.href = "/personal.html";
		}
	}
}

rhit.initPage = function () {
	// login page
	if (document.querySelector("#loginPage")) {
		console.log("You are on login page");
		new rhit.LoginPageController;
	}

	if (document.querySelector("#signupPage")) {
		console.log("You are on sign up page");
		new rhit.SignUpPageController;
	}

	if (document.querySelector("#resetPwPage")) {
		console.log("You are on reset password page");
		new rhit.ResetPwPageController;
	}

	if (document.querySelector("#welcomePage")) {
		console.log("You are on welcome page");
		new rhit.WelcomePageController;
	}

	if (document.querySelector("#mainPage")) {
		console.log("You are on main page");
		new rhit.MainPageController;
	}

	if (document.querySelector("#commentPage")) {
		console.log("You are on comment page");
		new rhit.CommentPageController;
	}

	if (document.querySelector("#updatePage")) {
		console.log("You are on update page");
		new rhit.UpdatePageController;
	}

	if (document.querySelector("#personalPage")) {
		console.log("You are on personal page");
		new rhit.PersonalPageController;
	}

	if (document.querySelector("#followingPage")) {
		console.log("You are on following page");
		new rhit.FollowingPageController;
	}

	if (document.querySelector("#sharePage")) {
		console.log("You are on share page");
		new rhit.SharePageController;
	}

	if (document.querySelector("#myPostsPage")) {
		console.log("You are on myposts page");
		new rhit.MyPostsPageController;
	}

	if (document.querySelector("#otherUserPage")) {
		console.log("You are on other user page");
		new rhit.OtherUserPageController;
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		//TODO: list to be replaced with main page
		window.location.href = "/main.html";
	}

	if (!document.querySelector("#loginPage") && !document.querySelector("#resetpasswordPage") && !document.querySelector("#signupPage") && !rhit.fbAuthManager.isSignedIn) {
		//TODO: list to be replaced with main page
		window.location.href = "/index.html";
	}
}

rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log(`isSingedIn: ${rhit.fbAuthManager.isSignedIn}`);
		rhit.checkForRedirects();
		rhit.initPage();
	});
};

rhit.main();