// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';

import rhs from './rhs';
import channel from './channel';
import dashboard from './dashboard';

export default combineReducers({
    rhs,
    channel,
    dashboard
});
