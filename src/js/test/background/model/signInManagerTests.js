﻿define([
    'background/model/signInManager',
    'background/model/settings',
    'background/model/user'
], function (SignInManager, Settings, User) {
    'use strict';

    describe('SignInManager', function () {
        beforeEach(function () {
            SignInManager.signOut();
        });

        describe('when not signed into Google Chrome ', function () {
            var USER_ID = '1111-1111-1111-1111';
            var GOOGLE_PLUS_ID = '';

            beforeEach(function () {
                sinon.stub(chrome.identity, 'getProfileUserInfo').yields({
                    id: GOOGLE_PLUS_ID,
                    email: ''
                });

                sinon.stub($, 'ajax').yieldsTo('success', {
                    id: USER_ID,
                    googlePlusId: GOOGLE_PLUS_ID,
                    playlists: [{
                        active: false
                    }]
                });

                sinon.spy(SignInManager, '_promptGoogleLogin');
                sinon.spy(SignInManager, '_promptLinkUserId');
                sinon.spy(SignInManager, '_onSignInSuccess');
            });
            
            afterEach(function () {
                chrome.identity.getProfileUserInfo.restore();
                $.ajax.restore();
                SignInManager._promptGoogleLogin.restore();
                SignInManager._promptLinkUserId.restore();
                SignInManager._onSignInSuccess.restore();
            });

            describe('when signing in as a new user', function() {
                it('the user should be signed in and should prompt to consider signing into Google Chrome', function () {
                    Settings.set('userId', null);
                    SignInManager.signInWithGoogle();
                    ensureSignedIn();
                });
            });

            describe('when signing in as an existing user', function() {
                it('the user should be signed should prompt to consider signing into Google Chrome', function () {
                    Settings.set('userId', USER_ID);
                    SignInManager.signInWithGoogle();
                    ensureSignedIn();
                });
            });
            
            function ensureSignedIn() {
                //  Once to login, again for checking to see if should prompt to link to Google Account.
                expect(chrome.identity.getProfileUserInfo.calledTwice).to.equal(true);
                expect(SignInManager.get('signedInUser')).not.to.equal(null);
                expect(SignInManager._onSignInSuccess.calledOnce).to.equal(true);
                //  Since the user isn't signed into Google Chrome we should prompt them to login so their data can be persisted across PCs.
                expect(SignInManager._promptGoogleLogin.calledOnce).to.equal(true);
                //  Since the user isn't signed into Google Chrome, we should NOT prompt them to link their data because there's no ID to link to yet.
                expect(SignInManager._promptLinkUserId.calledOnce).to.equal(false);
            }
        });

        describe('when signed into Google Chrome', function() {
            var USER_ID = '1111-1111-1111-1111';
            var GOOGLE_PLUS_ID = '111111111';

            beforeEach(function () {
                sinon.stub(chrome.identity, 'getProfileUserInfo').yields({
                    id: GOOGLE_PLUS_ID,
                    email: ''
                });

                sinon.spy(SignInManager, '_promptGoogleLogin');
                sinon.spy(SignInManager, '_promptLinkUserId');
            });

            afterEach(function () {
                chrome.identity.getProfileUserInfo.restore();
                $.ajax.restore();
                SignInManager._promptGoogleLogin.restore();
                SignInManager._promptLinkUserId.restore();
            });
                
            describe('when signing in as a new user', function () {
                beforeEach(function () {
                    sinon.stub($, 'ajax')
                        //  Return null because instantiating a new user (doesn't exist in database when trying to find by GooglePlusId
                        .onFirstCall().yieldsTo('success', null)
                        .onSecondCall().yieldsTo('success', {
                            id: USER_ID,
                            googlePlusId: GOOGLE_PLUS_ID,
                            playlists: [{
                                active: false
                            }]
                        });
                });

                it('should be created as a new user and should be linked to Google Chrome account', function () {
                    Settings.set('userId', null);
                    SignInManager.signInWithGoogle();
                    //  Once to login, again for checking to see if should prompt to link to Google Account.
                    expect(chrome.identity.getProfileUserInfo.calledTwice).to.equal(true);
                    //  Since the user is signed into Google Chrome we should not prompt them to login.
                    expect(SignInManager._promptGoogleLogin.calledOnce).to.equal(false);
                    //  Since the user is signed into Google Chrome, but their data is already linked, should not prompt them to link.
                    expect(SignInManager._promptLinkUserId.calledOnce).to.equal(false);
                });
            });

            describe('when signing in as an existing user', function () {
                beforeEach(function () {
                    sinon.stub($, 'ajax')
                        //  Return nothing because Google ID hasn't been linked to user yet.
                        .onFirstCall().yieldsTo('success', null)
                        //  Return the user by localStorage ID but still unlinked to Google Plus
                        .onSecondCall().yieldsTo('success', {
                            id: USER_ID,
                            googlePlusId: '',
                            playlists: [{
                                active: false
                            }]
                        });
                });

                it('user data should be preserved and should prompt to consider linking account to Google Chrome', function() {
                    Settings.set('userId', USER_ID);
                    SignInManager.signInWithGoogle();

                    //  Once to login, again for checking to see if should prompt to link to Google Account.
                    expect(chrome.identity.getProfileUserInfo.calledTwice).to.equal(true);
                    //  Since the user is signed into Google Chrome we should not prompt them to login.
                    expect(SignInManager._promptGoogleLogin.calledOnce).to.equal(false);
                    //  Since the user is signed into Google Chrome and their data is not linked -- prompt to link the account
                    expect(SignInManager._promptLinkUserId.calledOnce).to.equal(true);
                });
            });
        });

        describe('when data is loaded and signing into Google Chrome event has triggered', function () {
            var OLD_USER_ID = '1111-1111-1111-1111';
            var NEW_USER_ID = '2222-2222-2222-2222';
            var OLD_GOOGLE_PLUS_ID = '111111111';
            var NEW_GOOGLE_PLUS_ID = '222222222';

            beforeEach(function() {
                sinon.stub(chrome.identity, 'getProfileUserInfo').yields({
                    id: NEW_GOOGLE_PLUS_ID,
                    email: ''
                });
                
                sinon.spy(SignInManager, '_promptLinkUserId');
            });

            afterEach(function() {
                chrome.identity.getProfileUserInfo.restore();
                SignInManager._promptLinkUserId.restore();
                $.ajax.restore();
            });

            describe('when account already linked to Google', function () {
                beforeEach(function() {
                    Settings.set('userId', null);

                    //  Account already linked to Google:
                    SignInManager.set('signedInUser', new User({
                        googlePlusId: OLD_GOOGLE_PLUS_ID,
                        id: OLD_USER_ID
                    }));
                });

                describe('when new user is not linked to Google', function () {
                    beforeEach(function () {
                        sinon.stub($, 'ajax')
                            //  Return false on first AJAX request to hasLinkedGoogleAccount because NEW_GOOGE_PLUS_ID isn't linked to an existing account
                            .onFirstCall().yieldsTo('success', false)
                            //  Return new user data on second AJAX request to _create because can't link to the already signed in user since they've already got an account.
                            .onSecondCall().yieldsTo('success', {
                                id: NEW_USER_ID,
                                googlePlusId: NEW_GOOGLE_PLUS_ID,
                                playlists: [{
                                    active: false
                                }]
                            });
                    });

                    //  Since the new user can't be linked to the old user's data, but the new user already has a Google+ ID, use that Google+ ID in creating their account.
                    it('should create a new account and and link that account to the new user\'s account', function () {
                        SignInManager._onChromeSignInChanged({
                            id: NEW_GOOGLE_PLUS_ID,
                            email: ''
                        }, true);
                        
                        //  New user's account is already linked to Google.
                        expect(SignInManager._promptLinkUserId.calledOnce).to.equal(false);
                    });
                });

                describe('when new user is already linked to Google', function () {
                    beforeEach(function () {
                        sinon.stub($, 'ajax')
                            //  Return true on first AJAX request to hasLinkedGoogleAccount because NEW_GOOGE_PLUS_ID is linked to an existing account
                            .onFirstCall().yieldsTo('success', true)
                            //  Account is already linked to an Google ID in the DB, return user data:
                            .onSecondCall().yieldsTo('success', {
                                id: NEW_USER_ID,
                                googlePlusId: NEW_GOOGLE_PLUS_ID,
                                playlists: [{
                                    active: false
                                }]
                            });
                    });
                    
                    it('should swap to new account - old data is preserved in DB', function () {
                        SignInManager._onChromeSignInChanged({
                            id: NEW_GOOGLE_PLUS_ID,
                            email: ''
                        }, true);

                        //  New user's account is already linked to Google.
                        expect(SignInManager._promptLinkUserId.calledOnce).to.equal(false);
                    });
                });
            });

            describe('when current user\'s account is not linked to Google', function () {
                beforeEach(function() {
                    Settings.set('userId', null);

                    //  Currently signed in user's account is not linked to Google:
                    SignInManager.set('signedInUser', new User({
                        googlePlusId: '',
                        id: OLD_USER_ID
                    }));
                });

                describe('when new user\'s account is not linked to Google', function () {
                    beforeEach(function () {
                        sinon.stub($, 'ajax')
                            //  Return false on first AJAX request to hasLinkedGoogleAccount because NEW_GOOGE_PLUS_ID isn't linked to an existing account
                            .onFirstCall().yieldsTo('success', false);
                    });

                    it('should prompt new user to link their account to the existing account', function () {
                        SignInManager._onChromeSignInChanged({
                            id: NEW_GOOGLE_PLUS_ID,
                            email: ''
                        }, true);

                        //  Prompt the user to confirm that the account they just signed in with is the one they want to use to link to the currently existing data.
                        expect(SignInManager._promptLinkUserId.calledOnce).to.equal(true);
                    });
                });

                describe('when new user is already linked to Google', function () {
                    beforeEach(function () {
                        sinon.stub($, 'ajax')
                            //  Return true on first AJAX request to hasLinkedGoogleAccount because NEW_GOOGE_PLUS_ID is linked to an existing account
                            .onFirstCall().yieldsTo('success', true);
                    });

                    it('should swap to new account - old data is lost', function () {
                        SignInManager._onChromeSignInChanged({
                            id: NEW_GOOGLE_PLUS_ID,
                            email: ''
                        }, true);

                        //  Don't prompt the user to link accounts because we've just swapped to their new account, no linking necessary.
                        expect(SignInManager._promptLinkUserId.calledOnce).to.equal(false);
                    });
                });
            });
        });

        describe('when data is loaded and signing out of Google Chrome event has triggered', function () {
            var USER_ID = '1111-1111-1111-1111';
            var GOOGLE_PLUS_ID = '111111111';

            beforeEach(function() {
                sinon.spy(SignInManager, 'signOut');
                sinon.stub(chrome.identity, 'getProfileUserInfo').yields({
                    id: USER_ID,
                    email: ''
                });

                sinon.stub($, 'ajax');
            });

            afterEach(function () {
                SignInManager.signOut.restore();
                chrome.identity.getProfileUserInfo.restore();
                $.ajax.restore();
            });

            describe('when account is already linked to Google', function () {
                beforeEach(function () {
                    //  Currently signed in user's account is not linked to Google:
                    SignInManager.set('signedInUser', new User({
                        googlePlusId:GOOGLE_PLUS_ID,
                        id: USER_ID
                    }));

                    sinon.spy(SignInManager, 'signInWithGoogle');
                });

                it('should clear the current accounts data and create a new user', function () {
                    SignInManager._onChromeSignInChanged({
                        id: GOOGLE_PLUS_ID,
                        email: ''
                    }, false);

                    //  Sign out is called because the Google ID of the account signing out matches the signedInUser's ID
                    expect(SignInManager.signOut.calledOnce).to.equal(true);
                    expect(SignInManager.signInWithGoogle.calledOnce).to.equal(true);
                });

                afterEach(function () {
                    SignInManager.signInWithGoogle.restore();
                });
            });

            describe('when account is not linked to Google', function () {
                beforeEach(function () {
                    //  Currently signed in user's account is not linked to Google:
                    SignInManager.set('signedInUser', new User({
                        googlePlusId: '',
                        id: USER_ID
                    }));
                });

                it('should take no action against the existing account - data is preserved', function() {
                    SignInManager._onChromeSignInChanged({
                        id: GOOGLE_PLUS_ID,
                        email: ''
                    }, false);

                    //  Sign out is not called because the Google ID of the account signing out doesn't match the signedInUser's ID (because it is unlinked)
                    expect(SignInManager.signOut.calledOnce).to.equal(false);
                });
            });
        });
    });
})