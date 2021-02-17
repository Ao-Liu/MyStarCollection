var rhit = rhit || {};
rhit.BASE64 = null;
// User
rhit.FB_COLLECTION_USER = "User";
rhit.FB_KEY_UID = "uid";
rhit.FB_KEY_STARCOLLECTIONS = "StarCollections";
rhit.FB_KEY_POSTS = "Posts";
rhit.FB_KEY_FOLLOWING = "Following";
rhit.FB_KEY_USERNAME = "Username"

// Post
rhit.FB_COLLECTION_POST = "Post"
rhit.FB_KEY_TITLE = "Title";
rhit.FB_KEY_DES = "Description";
rhit.FB_KEY_PIC = "Pic";
rhit.FB_KEY_POSTBY = "PostBy";
rhit.FB_KEY_POSTTIME = "PostTime";
rhit.FB_KEY_COMMENTS = "Comments";
rhit.FB_KEY_LIKEDBY = "LikedBy"; //?
rhit.FB_KEY_SAVEDBY = "SavedBy"; //?
rhit.FB_KEY_POSTBYUSERNAME = "PostByUsername"; //?

rhit.userData = null;
rhit.fbAuthManager = null;
rhit.fbStarsManager = null;
rhit.fbUserDataManager = null;

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

Array.prototype.remove = function () {
	var what, a = arguments,
		L = a.length,
		ax;
	while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			this.splice(ax, 1);
		}
	}
	return this;
};

// Data model classes
rhit.User = class {
	constructor(uid, followings, posts, starCollections, username) {
		this._uid = uid;
		this._followings = followings;
		this._posts = posts;
		this._starCollections = starCollections;
		this._username = username;
	}
}

rhit.Post = class {
	constructor(pid, postBy, title, des, pic, likedBy, savedBy, postByUsername) {
		this._pid = pid;
		this._postBy = postBy;
		this._title = title;
		this._des = des;
		this._pic = pic;
		this._likedBy = likedBy;
		this._savedBy = savedBy;
		this._comments = [];
		this._postByUsername = postByUsername;
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
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USER);
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
			console.log("user", this._user);
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

rhit.FbUserDataManager = class {
	constructor(uid) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USER).doc(uid);
		console.log(`FbUserDataManager created: listening to ${uid}`);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	updateStarCollections(starCollections) {
		this._ref.update({
				[rhit.FB_KEY_STARCOLLECTIONS]: starCollections
			})
			.then(() => {
				console.log("update StarCollections success");
			})
			.catch((error) => {
				console.log(error);
			});
	}

	updateFollowings(followings) {
		this._ref.update({
				[rhit.FB_KEY_FOLLOWING]: followings
			})
			.then(() => {
				console.log("update followings success");
			})
			.catch((error) => {
				console.log(error);
			});
	}

	updatePosts(myPosts) {
		this._ref.update({
				[rhit.FB_KEY_POSTS]: myPosts
			})
			.then(() => {
				console.log("update followings success");
			})
			.catch((error) => {
				console.log(error);
			});
	}

	getUserData() {
		// uid, followings, posts, starCollections
		const userData = new rhit.User(
			this._documentSnapshot.id,
			this._documentSnapshot.get(rhit.FB_KEY_FOLLOWING),
			this._documentSnapshot.get(rhit.FB_KEY_POSTS),
			this._documentSnapshot.get(rhit.FB_KEY_STARCOLLECTIONS),
			this._documentSnapshot.get(rhit.FB_KEY_USERNAME)
		);
		return userData;
	}

	get following() {
		return this._documentSnapshot.get(rhit.FB_KEY_FOLLOWING);
	}
}

rhit.FbOtherUsersManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USER);
		this._unsusubscribe = null;
	}

	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_POSTTIME, "desc").limit(50);
		console.log("_uid", this._uid);
		if (this._uid) {
			query = query.where(rhit.FB_KEY_POSTBY, "==", this._uid);
		}

		this._unsusubscribe = query
			.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				console.log(this._documentSnapshots);
				changeListener();
			});
	}
}

rhit.FbStarsManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_POST);
		this._unsusubscribe = null;
	}

	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_POSTTIME, "desc").limit(50);
		console.log("_uid", this._uid);
		if (this._uid) {
			query = query.where(rhit.FB_KEY_POSTBY, "==", this._uid);
		}

		this._unsusubscribe = query
			.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				console.log(this._documentSnapshots);
				changeListener();
			});
	}

	add(title, description, pic) {
		this._ref.add({
				[rhit.FB_KEY_TITLE]: title,
				[rhit.FB_KEY_DES]: description,
				[rhit.FB_KEY_PIC]: pic,
				[rhit.FB_KEY_POSTBY]: rhit.fbAuthManager._user.uid,
				[rhit.FB_KEY_POSTTIME]: firebase.firestore.Timestamp.now(),
				[rhit.FB_KEY_COMMENTS]: [],
				[rhit.FB_KEY_LIKEDBY]: [],
				[rhit.FB_KEY_SAVEDBY]: [],
				[rhit.FB_KEY_POSTBYUSERNAME]: rhit.fbAuthManager._user.displayName
			})
			.then(function (docRef) {
				console.log(docRef.id);
				let userData = rhit.fbUserDataManager.getUserData();
				let myPosts = userData._posts;
				myPosts.push(docRef.id);
				rhit.fbUserDataManager.updatePosts(myPosts);
				alert("Post Successful!");
			})
			.catch(function (error) {
				console.log(error);
				alert("Post Error ", error);
			});
	}

	getStarPostAtIndex(index) {
		if (index >= this._documentSnapshots.length) {
			index = 0;
		}
		const docSnapshot = this._documentSnapshots[index];
		const post = new rhit.Post(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_POSTBY),
			docSnapshot.get(rhit.FB_KEY_TITLE),
			docSnapshot.get(rhit.FB_KEY_DES),
			docSnapshot.get(rhit.FB_KEY_PIC),
			docSnapshot.get(rhit.FB_KEY_LIKEDBY),
			docSnapshot.get(rhit.FB_KEY_SAVEDBY),
			docSnapshot.get(rhit.FB_KEY_POSTBYUSERNAME)
			//TODO: other fields
		);
		return post;
	}

	getStarPostByPid(pid) {
		let post = null;
		for (let i = 0; i < this._documentSnapshots.length; i++) {
			let docSnapshot = this._documentSnapshots[i];
			if (docSnapshot.id == pid) {
				post = new rhit.Post(
					docSnapshot.id,
					docSnapshot.get(rhit.FB_KEY_POSTBY),
					docSnapshot.get(rhit.FB_KEY_TITLE),
					docSnapshot.get(rhit.FB_KEY_DES),
					docSnapshot.get(rhit.FB_KEY_PIC),
					docSnapshot.get(rhit.FB_KEY_LIKEDBY),
					docSnapshot.get(rhit.FB_KEY_SAVEDBY),
					docSnapshot.get(rhit.FB_KEY_POSTBYUSERNAME)
					//TODO: other fields
				);
				break;
			}
		}
		return post;
	}

	getStarPostIndexByPid(pid) {
		let idx = null;
		for (let i = 0; i < this._documentSnapshots.length; i++) {
			let docSnapshot = this._documentSnapshots[i];
			if (docSnapshot.id == pid) {
				idx = i;
				break;
			}
		}
		return idx;
	}

	getStarPostByIndex(index) {
		if (index >= this._documentSnapshots.length) {
			index = 0;
		}
		const docSnapshot = this._documentSnapshots[index];
		console.log(docSnapshot.id);
		return this.getStarPostByPid(docSnapshot.id);
	}

	getMyStarCollections() {
		let uid = firebase.auth().currentUser.uid;
		let mscPosts = [];
		for (let i = 0; i < this._documentSnapshots.length; i++) {
			let docSnapshot = this._documentSnapshots[i];
			const post = new rhit.Post(
				docSnapshot.id,
				docSnapshot.get(rhit.FB_KEY_POSTBY),
				docSnapshot.get(rhit.FB_KEY_TITLE),
				docSnapshot.get(rhit.FB_KEY_DES),
				docSnapshot.get(rhit.FB_KEY_PIC),
				docSnapshot.get(rhit.FB_KEY_LIKEDBY),
				docSnapshot.get(rhit.FB_KEY_SAVEDBY),
				docSnapshot.get(rhit.FB_KEY_POSTBYUSERNAME)
				//TODO: other fields
			);
			if (post._savedBy.includes(uid)) {
				mscPosts.push(post);
			}
		}
		return mscPosts;
	}

	updateLikedBy(postId, likedBy) {
		this._ref.doc(postId).update({
				[rhit.FB_KEY_LIKEDBY]: likedBy
			})
			.then(() => {
				console.log("update likedBy success");
			})
			.catch((error) => {
				console.log(error);
			});
	}

	updateSavedBy(postId, savedByArr) {
		this._ref.doc(postId).update({
				[rhit.FB_KEY_SAVEDBY]: savedByArr
			})
			.then(() => {
				console.log("update saved by success");
			})
			.catch((error) => {
				console.log(error);
			});
	}

	stopListening() {
		this._unsusubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
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
					// window.location.href = `/main.html`;
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

					//set username
					user.updateProfile({
						displayName: `@${inputUsernameEl.value}`,
					}).then(function () {

						firebase.firestore().collection(rhit.FB_COLLECTION_USER).doc(user.uid).set({
								[rhit.FB_KEY_FOLLOWING]: [],
								[rhit.FB_KEY_POSTS]: [],
								[rhit.FB_KEY_STARCOLLECTIONS]: [],
							})
							.then(function () {
								console.log("User profile successfully written!");
								window.location.href = "/welcome.html";
							})
							.catch(function (error) {
								console.error("Error writing user profile: ", error);
							});

					}).catch(function (error) {
						console.log(error);
						switch (error) {
							default:
								alert("An error occured");
								break;
						}
						return;
					});
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
			// window.location.href = `/main.html?id=pQqxwBajWjdPe78B0Q1u`;
		}
	}
}

rhit.MainPageController = class {
	constructor() {
		this.curPost = null;
		this.userData = null;
		this.index = 0;

		rhit.fbStarsManager.beginListening(this.updateView.bind(this));
		rhit.fbUserDataManager.beginListening(this.updateView.bind(this));

		this._ssId = sessionStorage.getItem("postId");
		if (this._ssId != undefined) {
			console.log("ssid", this._ssId);
			this.index = rhit.fbStarsManager.getStarPostIndexByPid(this._ssId);
			console.log("ss idx", this.index);
			sessionStorage.removeItem("postId");
		}

		document.querySelector("#likeBtn").onclick = (event) => {
			const uid = rhit.fbAuthManager._user.uid;
			let likedByArr = this.curPost._likedBy;
			if (!likedByArr.includes(uid)) {
				likedByArr.push(uid);
				rhit.fbStarsManager.updateLikedBy(this.curPost._pid, likedByArr);
			} else {
				likedByArr.remove(uid);
				rhit.fbStarsManager.updateLikedBy(this.curPost._pid, likedByArr);
			}
			this.updateView();
		}

		document.querySelector("#saveBtn").onclick = (event) => {
			const uid = rhit.fbAuthManager._user.uid;
			this.userData = rhit.fbUserDataManager.getUserData();
			let userDataColArr = this.userData._starCollections;
			let savedByArr = this.curPost._savedBy;
			if (!savedByArr.includes(uid)) {
				savedByArr.push(uid);
				userDataColArr.push(this.curPost._pid);
			} else {
				savedByArr.remove(uid);
				userDataColArr.remove(this.curPost._pid);
			}
			rhit.fbStarsManager.updateSavedBy(this.curPost._pid, savedByArr);
			rhit.fbUserDataManager.updateStarCollections(userDataColArr);
			this.updateView();
		}

		document.querySelector("#followUser").onclick = (event) => {
			let e = document.getElementById('followUser');
			const uid = rhit.fbAuthManager._user.uid;
			this.userData = rhit.fbUserDataManager.getUserData();
			let userDataFollowingArr = this.userData._followings;
			let author = document.querySelector("#author").innerHTML;
			author = author.replace("&nbsp;&nbsp;", "");
			// console.log("following", userDataFollowingArr);
			if (!userDataFollowingArr.includes(this.curPost._postBy)) {
				userDataFollowingArr.push(this.curPost._postBy + this.curPost._postByUsername);
				console.log(document.querySelector("#author").innerHTML);
				e.classList.remove('fa-user-plus');
				e.classList.add('fa-user-check');
				alert(`You are now following ${author}`);
			} else {
				userDataFollowingArr.remove(this.curPost._postBy);
				e.classList.remove('fa-user-check');
				e.classList.add('fa-user-plus');
				alert(`You have unfollowed ${author}`);
			}
			rhit.fbUserDataManager.updateFollowings(userDataFollowingArr);
			this.updateView();
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

		document.querySelector("#submitAddStar").onclick = (event) => {
			const title = document.querySelector("#inputStarName").value;
			const des = document.querySelector("#inputStarDes").value;
			const inputUrl = document.querySelector("#inputStarUrl").value;
			const uploadPic = document.querySelector("#inputStarUploadPic").files[0];

			if (inputUrl == "") {
				//upload picture
				const ref = firebase.storage().ref();
				const file = document.querySelector("#inputStarUploadPic").files[0];
				const name = +new Date() + "-" + file.name;
				const metadata = {
					contentType: file.type
				};
				const task = ref.child(name).put(file, metadata);
				task.then(snapshot => snapshot.ref.getDownloadURL())
					.then(url => {
						console.log(url);
						rhit.fbStarsManager.add(title, des, url);
					})
					.catch((error) => {
						console.log(error);
					});
			} else if (uploadPic == undefined) {
				rhit.fbStarsManager.add(title, des, inputUrl);
			} else {
				alert("Please either add an url or upload an image");
				return;
			}
		}

		document.querySelector("#nextBtn").onclick = (event) => {
			this.index++;
			if (this.index >= rhit.fbStarsManager.length) {
				this.index = 0;
			}
			this.updateView();
		}
	}

	updateView() {
		if (this._ssId == undefined) {
			this.curPost = rhit.fbStarsManager.getStarPostAtIndex(this.index);
		} else {
			this.curPost = rhit.fbStarsManager.getStarPostByPid(this._ssId);
			sessionStorage.removeItem("postId");
			this.index = rhit.fbStarsManager.getStarPostIndexByPid(this._ssId);
			this._ssId = undefined;
		}
		if (this.curPost == null || this.curPost == undefined) {
			alert("Error occured!");
			return;
		}
		// post basic info
		document.querySelector("#author").innerHTML = this.curPost._postByUsername + "&nbsp;&nbsp;";
		document.querySelector("#starPic").src = this.curPost._pic;
		document.querySelector("#starTitle").innerHTML = this.curPost._title;
		document.querySelector("#starDes").innerHTML = this.curPost._des;

		// like btn
		const uid = rhit.fbAuthManager._user.uid;
		let likedByArr = this.curPost._likedBy;
		if (likedByArr.includes(uid)) {
			document.querySelector("#likeBtn").style.color = "#CC000A";
		} else {
			document.querySelector("#likeBtn").style.color = "#555";
		}

		// save btn
		let savedByArr = this.curPost._savedBy;
		if (savedByArr.includes(uid)) {
			document.querySelector("#saveBtn").style.color = "#F2E822";
		} else {
			document.querySelector("#saveBtn").style.color = "#555";
		}

		// follow user
		let e = document.getElementById('followUser');
		if (rhit.fbAuthManager._user.uid == this.curPost._postBy) {
			e.style.display = "none";
			return;
		} else {
			e.style.display = "";
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
		this._myStarCollections = null;

		rhit.fbStarsManager.beginListening(this.updateView.bind(this));
		rhit.fbUserDataManager.beginListening(this.updateView.bind(this));

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
			window.location.href = "/following.html";
			// window.location.href = "/otheruser.html";
		}
	}

	updateView() {
		document.querySelector("#username").innerHTML = firebase.auth().currentUser.displayName;
		document.querySelector("#email").innerHTML = firebase.auth().currentUser.email;

		// my star collection list
		this._myStarCollections = rhit.fbStarsManager.getMyStarCollections();
		this.updateList();
	}

	_createMyStarColsCard(post) {
		return htmlToElement(`<div class="card">
		<div class="card-body">
		  <h5 class="card-title"><img src=${post._pic}>&nbsp;&nbsp;${post._title} by ${post._postByUsername}</h5>
		</div>
	  </div>`);
	}

	updateList() {
		const newList = htmlToElement('<div id="myColContainer"></div>');
		for (let i = 0; i < this._myStarCollections.length; i++) {
			const post = this._myStarCollections[i];
			const newCard = this._createMyStarColsCard(post);
			if (i == 0) {
				document.querySelector("#starPic").src = post._pic;
			}
			newCard.onclick = (event) => {
				// window.location.href = `/moviequote.html?id=${mq.id}`;
				window.location.href = "/main.html";
				sessionStorage.setItem("postId", post._pid);
			};
			newList.append(newCard);
		}
		const oldList = document.querySelector("#myColContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.append(newList);
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

rhit.FollowingPageController = class { // following list
	constructor() {
		document.querySelector("#backBtn").onclick = (event) => {
			window.location.href = "/personal.html";
		}


	}

	updateList() {
		const newList = htmlToElement('<div id="followingListContainer"></div>');
		for (let i = 0; i < this._myStarCollections.length; i++) {
			const post = this._myStarCollections[i];
			const newCard = this._createMyFollowingCard(post);
			newCard.onclick = (event) => {
				// window.location.href = "/main.html";
				// sessionStorage.setItem("postId", post._pid);
			};
			newList.append(newCard);
		}
		const oldList = document.querySelector("#followingListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.append(newList);
	}

	_createMyFollowingCard(username) {
		return htmlToElement(`<div class="card">
        <div class="card-body">
          <h5 class="card-title">${username}&nbsp;&nbsp;<i class="fas fa-user-check"></i></h5>
        </div>
        <hr>
      </div>`);
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
		rhit.fbStarsManager.beginListening(this.updateView.bind(this));

		document.querySelector("#backBtn").onclick = (event) => {
			window.location.href = "/personal.html";
		}
	}

	updateView() {
		const newList = htmlToElement('<div id="myPostsListContainer"></div>');
		for (let i = rhit.fbStarsManager.length - 1; i >= 0; i--) {
			const post = rhit.fbStarsManager.getStarPostAtIndex(i);
			const newCard = this._createMyPostsCard(post);
			newCard.onclick = (event) => {
				// window.location.href = `/moviequote.html?id=${mq.id}`;
				window.location.href = "/main.html";
				sessionStorage.setItem("postId", post._pid);
			};
			newList.append(newCard);
		}
		const oldList = document.querySelector("#myPostsListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.append(newList);
	}

	_createMyPostsCard(post) {
		return htmlToElement(`<div class="card">
        <div class="card-body">
          <h5 class="card-title"><img src=${post._pic}>&nbsp;&nbsp;${post._title}&nbsp;&nbsp;</h5>
        </div>
      </div>`);
	}
}

rhit.OtherUserPageController = class {
	constructor() {
		document.querySelector("#backBtn").onclick = (event) => {
			// window.location.href = "/personal.html";
			window.location.href = "/following.html";
		}

		document.querySelector("#unfollowBtn").onclick = (event) => {
			let e = document.getElementById('unfollowBtn');
			console.log(e.style.background);
			let username = document.querySelector("#username").innerHTML;
			if (e.classList.contains('fa-user-times')) {
				e.classList.remove('fa-user-times');
				e.classList.add('fa-user-plus');
				e.innerHTML = "&nbsp;Follow";
				alert(`You have unfollowed ${username}`);
			} else {
				e.classList.remove('fa-user-plus');
				e.classList.add('fa-user-times');
				e.innerHTML = "&nbsp;Unfollow";
				alert(`You are following ${username}`);
			}
		}
	}
}

rhit.initPage = function () {
	const urlParams = new URLSearchParams(window.location.search);

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
		rhit.fbUserDataManager = new rhit.FbUserDataManager(firebase.auth().currentUser.uid);
		const uid = urlParams.get(`uid`);
		console.log("uid", uid);
		rhit.fbStarsManager = new rhit.FbStarsManager(uid);
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
		rhit.fbUserDataManager = new rhit.FbUserDataManager(firebase.auth().currentUser.uid);
		let uid = urlParams.get(`uid`);
		rhit.fbStarsManager = new rhit.FbStarsManager(uid);
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
		rhit.fbUserDataManager = new rhit.FbUserDataManager(firebase.auth().currentUser.uid);
		let uid = urlParams.get(`uid`);
		uid = firebase.auth().currentUser.uid;
		console.log("uid", uid);
		rhit.fbStarsManager = new rhit.FbStarsManager(uid);
		new rhit.MyPostsPageController;
	}

	if (document.querySelector("#otherUserPage")) {
		console.log("You are on other user page");
		new rhit.OtherUserPageController;
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/main.html";
	}

	// if (rhit.fbAuthManager.isSignedIn) {
	// 	window.location.href = "/main.html";
	// }

	if (!document.querySelector("#loginPage") && !document.querySelector("#resetPwPage") && !document.querySelector("#signupPage") && !rhit.fbAuthManager.isSignedIn) {
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