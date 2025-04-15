// cookie script
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
// end cookie script

// sha256 hash function
async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);                    

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string                  
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
// end sha256 hash function

let createUserHash = async (email, pass) => sha256(email+pass);

document.addEventListener('DOMContentLoaded', function() {
  // elements
  const sidebar = document.querySelector('.sidebar');
  const openSidebar = document.querySelector('.logo');
  
  // submit event listener
  const signinBtn = document.getElementById('signin-btn');
  const signupBtn = document.getElementById('signup-btn');
  
  if (signinBtn) {
    signinBtn.addEventListener('click', signin);
  } else {
    console.error('internal error: signin button not found');
  }

  if (signupBtn) {
    signupBtn.addEventListener('click', signup);
  } else {
    console.error('internal error: signup button not found');
  }
});

async function signin() {
  // elements
  let emailOBJ = document.getElementById('email');
  let passOBJ = document.getElementById('pass');
  let errs = document.getElementById('si-errs');

  function errormsg(err) {
    errs.innerHTML = err;
    errs.style.display = 'block';
    setTimeout(() => {errs.innerHTML = ''}, 2000);
  }

  errormsg("PLEASE WAIT...")

  if (!emailOBJ || !passOBJ) {
    errormsg('INTERNAL ERROR: <small>email or password input not found</small>');
    return console.error('user error: email or password input not found');
  }

  createUserHash(emailOBJ.value, passOBJ.value).then(hash => {
    // errors
    if (emailOBJ.value == '') return errormsg('EMAIL REQUIRED');
    if (passOBJ.value == '') return errormsg('PASSWORD REQUIRED');

    DB.auth.signIn(emailOBJ.value, passOBJ.value).then((uid) => {
      if (typeof uid === "object" && uid.hasOwnProperty("error")) {
        console.log("auth failed: ", uid['error']);
        errormsg({
          "wrong-password": "That password doesn't look right.",
          "user-not-found": "No account found with that email.",
          "invalid-email": "Please check the email format.",
          "too-many-requests": "Too many attempts. Try again later.",
          "user-disabled": "This account has been disabled.",
          "network-request-failed": "Network issue. Try again later.",
        }[uid['error'].replace('auth/','')] || "Internal Error. Try again. If the problem persists, please contact help@financeforward.us");
      }
      console.log('auth created:', emailOBJ.value, passOBJ.value);
      console.log('uid:', uid);
      errormsg('AUTH CREATED');
    }).catch(err => {
      console.error('firebase auth error:', err);
      errormsg('INTERNAL: AUTHENTICATION ERROR');
      return;
    });

    DB.u.exists(hash).then(exists => {
      if (!exists) {
        errormsg('ACCOUNT NOT FOUND');
        return;
      }
      else {
        errormsg('ACCOUNT FOUND');
        console.log('account found:', hash);

        // set cookie
        let date = new Date();
        date.setDate(date.getDate() + 1);
        document.cookie = `hash=${hash}; path=/; expires=${date.toUTCString()}`;
        errormsg('SIGNED IN!');

        // redirect
        location.href = '../dashboard';
      }
    });
  });
}

async function signup() {
  // elements
  let emailOBJ = document.getElementById('email_up');
  let passOBJ = document.getElementById('pass_up');
  let passCheckOBJ = document.getElementById('pass2_up');
  let currencyOBJ = document.getElementById('currency');
  let errs = document.getElementById('su-errs');

  let currency = currencyOBJ.value;

  function errormsg(err) {
    errs.innerHTML = err;
    errs.style.display = 'block';
    setTimeout(() => {errs.innerHTML = ''}, 2000);
  }

  errormsg("PLEASE WAIT...")

  if (!emailOBJ || !passOBJ) {
    errormsg('INTERNAL ERROR: <small>email or password input not found</small>');
    return console.error('user error: email or password input not found');
  }

  createUserHash(emailOBJ.value, passOBJ.value).then(hash => {
    // errors
    if (emailOBJ.value == '') return errormsg('EMAIL REQUIRED');
    if (passOBJ.value == '') return errormsg('PASSWORD REQUIRED');
    if (passOBJ.value != passCheckOBJ.value) return errormsg('PASSWORDS DO NOT MATCH');

    let uid_G = null;
    DB.auth.create(emailOBJ.value, passOBJ.value).then((uid) => {
      console.log('auth created:', emailOBJ.value, passOBJ.value);
      errormsg('AUTH CREATED');
      uid_G = uid;
    }).catch(err => {
      console.error('firebase auth error:', err);
      errormsg('INTERNAL: AUTHENTICATION ERROR');
      return;
    });
    DB.u.exists(hash).then(exists => {
      if (exists) {
        errormsg('ACCOUNT ALREADY EXISTS');
        return;
      }
      else {
        DB.u.create(hash).then(_ => {
          console.log('account created:', hash);

          // set currency
          DB.u.update(hash, {'currency': currency, 'ownerUid': uid_G}).then(() => {
            console.log('currency set:', currency);
            errormsg('ACCOUNT CREATED');

            // set cookie
            let date = new Date();
            date.setDate(date.getDate() + 1);
            document.cookie = `hash=${hash}; path=/; expires=${date.toUTCString()}`;
            errormsg('LOGGED IN');

            // redirect
            location.href = '../dashboard';
          })
        });
      }
    });
  });
}

let name = "hash=";
let ca = decodeURIComponent(document.cookie).split(';');
for(let i = 0; i <ca.length; i++) {
  let c = ca[i];
  while (c.charAt(0) == ' ') {
  c = c.substring(1);
  }
  if (c.indexOf(name) == 0) {
  if (getCookie('hash') != '') {
      document.querySelector('.sign-in').style.display = 'none';
  }
  }
}