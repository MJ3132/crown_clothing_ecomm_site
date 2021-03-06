import { takeLatest, put, all, call } from "redux-saga/effects";
import UserActionTypes from "./user.types";
import { auth, googleProvider, createUserProfileDocument, getCurrentUser, createUserWithEmailAndPassword } from "../../firebase/firebase.utils";
import userReducer from "./user.reducer";
import { 
    signInSuccess, 
    signInFailure, 
    signOutSuccess, 
    signOutFailure,
    signUpFailure,
    signUpSuccess    
} from "./user.actions";

export function* getSnapshotFromUserAuth(userAuth, additionalData) {

    try {
        const userRef = yield call(createUserProfileDocument, userAuth, additionalData);
        const userSnapShot = yield userRef.get();

        // remember put puts things back into our regular Redux flow, its the saga way
        // to dispatching new actions
        yield put(signInSuccess({ id: userSnapShot.id, ...userSnapShot.data() }))

    } catch (error) {
        yield put(signInFailure(error));

    }
}


export function* signInWithGoogle() {
    try {
        const { user } = yield auth.signInWithPopup(googleProvider);

        yield getSnapshotFromUserAuth(user);

    } catch (error) {
        yield put(signInFailure(error));

    }

}

export function* signInWithEmail({ payload: { email, password } }) {
    try {

        const { user } = yield auth.signInWithEmailAndPassword(email, password);

        yield getSnapshotFromUserAuth(user);


    } catch (error) {
        yield put(signInFailure(error))
    }
}

export function* isUserAuthenticated() {

  
    try {
        const userAuth = yield getCurrentUser();

        if (!userAuth) return;
        yield getSnapshotFromUserAuth(userAuth)
    } catch(error) {
        yield put(signInFailure(error))

    }
}



export function* onGoogleSignInStart() {

    yield takeLatest(UserActionTypes.GOOGLE_SIGN_IN_START, signInWithGoogle)

}

export function* onEmailSignInStart() {
    yield takeLatest(UserActionTypes.EMAIL_SIGN_IN_START, signInWithEmail)

}

export function* onCheckUserSession() {
    yield takeLatest(UserActionTypes.CHECK_USER_SESSION, isUserAuthenticated)
}

export function* onSignOut() {
    try {
        yield auth.signOut();
        yield (put(signOutSuccess()))
    } catch (error) {
        yield put(signOutFailure(error));
    }
}

export function* onSignOutStart() {
    yield takeLatest(UserActionTypes.SIGN_OUT_START,onSignOut)

}


export function* signUp({payload: {displayName, email, password}}) {
    try {

      const { user } = yield auth.createUserWithEmailAndPassword(email, password);
      console.log("user on signup from saga " , user)
    yield createUserProfileDocument(user, {displayName});
       
       yield put(signUpSuccess({user, additionalData : { displayName }}))


    } catch (error) {
        yield put(signUpFailure(error));

    }
}

export function* signInAfterSignUp({payload: {user , additionalData}}) {

    yield getSnapshotFromUserAuth(user,additionalData);

}


export function* onSignUpStart() {
    yield takeLatest(UserActionTypes.SIGN_UP_START,signUp)
}

export function* onSignUpSuccess() {
    yield takeLatest(UserActionTypes.SIGN_UP_SUCCESS, signInAfterSignUp)
}

export function* userSagas() {

    yield all([
        call(onGoogleSignInStart),
        call(onEmailSignInStart),
        call(onCheckUserSession),
        call(onSignOutStart),
        call(onSignUpStart),
        call(onSignUpSuccess)
    
    ])

}

