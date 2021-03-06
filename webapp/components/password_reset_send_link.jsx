// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import $ from 'jquery';
import ReactDOM from 'react-dom';
import * as Utils from 'utils/utils.jsx';
import {sendPasswordResetEmail} from 'actions/user_actions.jsx';

import {FormattedMessage, FormattedHTMLMessage} from 'react-intl';

import PropTypes from 'prop-types';

import React from 'react';
import {Link} from 'react-router/es6';

class PasswordResetSendLink extends React.Component {
    constructor(props) {
        super(props);

        this.handleSendLink = this.handleSendLink.bind(this);

        this.state = {
            error: '',
            updateText: ''
        };
    }
    handleSendLink(e) {
        e.preventDefault();

        var email = ReactDOM.findDOMNode(this.refs.email).value.trim().toLowerCase();
        if (!email || !Utils.isEmail(email)) {
            this.setState({
                error: (
                    <FormattedMessage
                        id={'password_send.error'}
                        defaultMessage={'Please enter a valid email address.'}
                    />
                )
            });
            return;
        }

        // End of error checking clear error
        this.setState({
            error: ''
        });

        sendPasswordResetEmail(
            email,
            () => {
                this.setState({
                    error: null,
                    updateText: (
                        <div className='reset-form alert alert-success'>
                            <FormattedHTMLMessage
                                id='password_send.link'
                                defaultMessage='If the account exists, a password reset email will be sent to: <br/><b>{email}</b><br/><br/>'
                                values={{
                                    email
                                }}
                            />
                            <FormattedMessage
                                id='password_send.checkInbox'
                                defaultMessage='Please check your inbox.'
                            />
                        </div>
                    )
                });
                $(ReactDOM.findDOMNode(this.refs.reset_form)).hide();
            },
            (err) => {
                this.setState({
                    error: err.message,
                    update_text: null
                });
            }
        );
    }
    render() {
        var error = null;
        if (this.state.error) {
            error = <div className='form-group has-error'><label className='control-label'>{this.state.error}</label></div>;
        }

        var formClass = 'form-group';
        if (error) {
            formClass += ' has-error';
        }

        return (
            <div>
                <div className='signup-header'>
                    <Link to='/'>
                        <span className='fa fa-chevron-left'/>
                        <FormattedMessage
                            id='web.header.back'
                        />
                    </Link>
                </div>
                <div className="clearfix"></div>
                <div className='wrap_585px'>
                    <div className='image-part-on-signin-page'>
                        <img src="https://s3.ap-south-1.amazonaws.com/1thing-logos/sign-in-graphic.svg"/>
                    </div>
                    <div className='signup-team__container'>
                    <div className='signin-title'>
                        <h2>
                            <FormattedMessage
                                id='password_send.title'
                                defaultMessage='Password Reset'
                            />
                        </h2>
                    </div>
                        {this.state.updateText}
                        <form
                            onSubmit={this.handleSendLink}
                            ref='reset_form'
                        >
                            <div className='signup__content'>
                                <h4 className='color--light'>
                                    <FormattedMessage
                                        id='password_send.description'
                                        defaultMessage='To reset your password, enter the email address you used to sign up'
                                    />
                                </h4>
                            </div>
                            <div className={formClass}>
                            <div className="user-email"></div>
                                <input
                                    type='email'
                                    className='form-control reset-password'
                                    name='email'
                                    ref='email'
                                    placeholder={Utils.localizeMessage(
                                        'password_send.email',
                                        'Enter your email'
                                    )}
                                    spellCheck='false'
                                />
                            </div>
                            {error}
                            <button
                                id='passwordResetButton'
                                type='submit'
                                className='btn btn-primary'
                            >
                                <FormattedMessage
                                    id='password_send.reset'
                                    defaultMessage='Reset my password'
                                />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

PasswordResetSendLink.defaultProps = {
};
PasswordResetSendLink.propTypes = {
    params: PropTypes.object.isRequired
};

export default PasswordResetSendLink;
