﻿define([
    'background/model/settings',
    'background/model/user'
], function (Settings, User) {
    'use strict';

    describe('User', function () {
        var USER_ID = '1111-1111-1111-1111';
        var GOOGLE_PLUS_ID = '';

        beforeEach(function() {
            this.user = new User();
        });
        
        function ensureUserState() {
            expect(this.user.get('googlePlusId')).to.equal(GOOGLE_PLUS_ID);
            expect(this.user.get('id')).to.equal(USER_ID);
        }

        describe('when trying to load by user id', function () {
            beforeEach(function () {
                sinon.stub($, 'ajax').yieldsTo('success', {
                    id: USER_ID,
                    googlePlusId: GOOGLE_PLUS_ID,
                    playlists: [{
                        active: false
                    }]
                });
                
                sinon.spy(this.user, '_create');
                sinon.spy(this.user, '_loadByUserId');
            });

            it('should use _create if no user id is in localStorage', function () {
                Settings.set('userId', null);
                this.user.tryloadByUserId();
                expect(this.user._create.calledOnce).to.equal(true);
                expect($.ajax.calledOnce).to.equal(true);
                ensureUserState.call(this);
            });
            
            it('should use _loadByUserId if a user id is in localStorage', function () {
                Settings.set('userId', USER_ID);
                this.user.tryloadByUserId();
                expect(this.user._loadByUserId.calledOnce).to.equal(true);
                expect($.ajax.calledOnce).to.equal(true);
                ensureUserState.call(this);
            });

            afterEach(function () {
                $.ajax.restore();
                this.user._create.restore();
                this.user._loadByUserId.restore();
            });
        });

        describe('when trying to load by Google Plus id', function () {
            describe('when Google ID does exists in database', function () {
                beforeEach(function() {
                    sinon.stub($, 'ajax')
                        .onFirstCall().yieldsTo('success', {
                            id: USER_ID,
                            googlePlusId: GOOGLE_PLUS_ID,
                            playlists: [{
                                active: false
                            }]
                        });
                    
                    sinon.spy(this.user, '_onLoadSuccess');
                });
                
                it('should fetch the user from the database by GooglePlus ID', function () {
                    Settings.set('userId', null);
                    this.user.loadByGooglePlusId();
                    //  Once for fetchByGoogleId which returns null and then again to create a new account which is tied to the Google account.
                    expect($.ajax.calledOnce).to.equal(true);
                    expect(this.user._onLoadSuccess.calledOnce).to.equal(true);
                    ensureUserState.call(this);
                });
                
                afterEach(function () {
                    $.ajax.restore();
                    this.user._onLoadSuccess.restore();
                });
            });
        });
    });
});