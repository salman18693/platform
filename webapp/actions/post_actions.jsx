// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import AppDispatcher from 'dispatcher/app_dispatcher.jsx';

import ChannelStore from 'stores/channel_store.jsx';
import UserStore from 'stores/user_store.jsx';
import PostStore from 'stores/post_store.jsx';
import TeamStore from 'stores/team_store.jsx';

import {loadNewDMIfNeeded, loadNewGMIfNeeded} from 'actions/user_actions.jsx';
import {sendDesktopNotification} from 'actions/notification_actions.jsx';

import Constants from 'utils/constants.jsx';
const ActionTypes = Constants.ActionTypes;

// Redux actions
import store from 'stores/redux_store.jsx';
const dispatch = store.dispatch;
const getState = store.getState;

import {getProfilesByIds} from 'mattermost-redux/actions/users';
import * as PostActions from 'mattermost-redux/actions/posts';
import {getMyChannelMember} from 'mattermost-redux/actions/channels';

import {Client4} from 'mattermost-redux/client';

import {PostTypes} from 'mattermost-redux/action_types';
import * as Selectors from 'mattermost-redux/selectors/entities/posts';
import {batchActions} from 'redux-batched-actions';

export function handleNewPost(post, msg) {
    let websocketMessageProps = {};
    if (msg) {
        websocketMessageProps = msg.data;
    }

    if (ChannelStore.getMyMember(post.channel_id)) {
        completePostReceive(post, websocketMessageProps);
    } else {
        getMyChannelMember(post.channel_id)(dispatch, getState).then(() => completePostReceive(post, websocketMessageProps));
    }

    if (msg && msg.data) {
        if (msg.data.channel_type === Constants.DM_CHANNEL) {
            loadNewDMIfNeeded(post.channel_id);
        } else if (msg.data.channel_type === Constants.GM_CHANNEL) {
            loadNewGMIfNeeded(post.channel_id);
        }
    }
}

function completePostReceive(post, websocketMessageProps) {
    if (post.root_id && Selectors.getPost(getState(), post.root_id) == null) {
        PostActions.getPostThread(post.root_id)(dispatch, getState).then(
            (data) => {
                // Need manual dispatch to remove pending post
                dispatch({
                    type: PostTypes.RECEIVED_POSTS,
                    data: {
                        order: [],
                        posts: {
                            [post.id]: post
                        }
                    },
                    channelId: post.channel_id
                });

                // Still needed to update unreads
                AppDispatcher.handleServerAction({
                    type: ActionTypes.RECEIVED_POST,
                    post,
                    websocketMessageProps
                });

                sendDesktopNotification(post, websocketMessageProps);
                loadProfilesForPosts(data.posts);
            }
        );

        return;
    }

    dispatch({
        type: PostTypes.RECEIVED_POSTS,
        data: {
            order: [],
            posts: {
                [post.id]: post
            }
        },
        channelId: post.channel_id
    });

    // Still needed to update unreads
    AppDispatcher.handleServerAction({
        type: ActionTypes.RECEIVED_POST,
        post,
        websocketMessageProps
    });

    sendDesktopNotification(post, websocketMessageProps);
}

export function flagPost(postId) {
    PostActions.flagPost(postId)(dispatch, getState);
}

export function unflagPost(postId) {
    PostActions.unflagPost(postId)(dispatch, getState);
}

export function getFlaggedPosts() {
    Client4.getFlaggedPosts(UserStore.getCurrentId(), '', TeamStore.getCurrentId()).then(
        (data) => {
            AppDispatcher.handleServerAction({
                type: ActionTypes.RECEIVED_SEARCH_TERM,
                term: null,
                do_search: false,
                is_mention_search: false
            });

            AppDispatcher.handleServerAction({
                type: ActionTypes.RECEIVED_SEARCH,
                results: data,
                is_flagged_posts: true,
                is_pinned_posts: false
            });

            loadProfilesForPosts(data.posts);
        }
    ).catch(
        () => {} //eslint-disable-line no-empty-function
    );
}

export function getPinnedPosts(channelId = ChannelStore.getCurrentId()) {
    Client4.getPinnedPosts(channelId).then(
        (data) => {
            AppDispatcher.handleServerAction({
                type: ActionTypes.RECEIVED_SEARCH_TERM,
                term: null,
                do_search: false,
                is_mention_search: false
            });

            AppDispatcher.handleServerAction({
                type: ActionTypes.RECEIVED_SEARCH,
                results: data,
                is_flagged_posts: false,
                is_pinned_posts: true
            });

            loadProfilesForPosts(data.posts);
        }
    ).catch(
        () => {} //eslint-disable-line no-empty-function
    );
}

export function loadProfilesForPosts(posts) {
    const profilesToLoad = {};
    for (const pid in posts) {
        if (!posts.hasOwnProperty(pid)) {
            continue;
        }

        const post = posts[pid];
        if (!UserStore.hasProfile(post.user_id)) {
            profilesToLoad[post.user_id] = true;
        }
    }

    const list = Object.keys(profilesToLoad);
    if (list.length === 0) {
        return;
    }

    getProfilesByIds(list)(dispatch, getState);
}

export function addReaction(channelId, postId, emojiName) {
    PostActions.addReaction(postId, emojiName)(dispatch, getState);
}

export function removeReaction(channelId, postId, emojiName) {
    PostActions.removeReaction(postId, emojiName)(dispatch, getState);
}

export function createPost(post, files, success) {
    PostActions.createPost(post, files)(dispatch, getState).then(() => {
        if (post.root_id) {
            PostStore.storeCommentDraft(post.root_id, null);
        } else {
            PostStore.storeDraft(post.channel_id, null);
        }

        if (success) {
            success();
        }
    });
}

export function updatePost(post, success) {
    PostActions.editPost(post)(dispatch, getState).then(
        (data) => {
            if (data && success) {
                success();
            }
        }
    );
}

export function emitEmojiPosted(emoji) {
    AppDispatcher.handleServerAction({
        type: ActionTypes.EMOJI_POSTED,
        alias: emoji
    });
}

export function deletePost(channelId, post, success) {
    const {currentUserId} = getState().entities.users;

    let hardDelete = false;
    if (post.user_id === currentUserId) {
        hardDelete = true;
    }

    PostActions.deletePost(post, hardDelete)(dispatch, getState).then(
        () => {
            if (post.id === getState().views.rhs.selectedPostId) {
                dispatch({
                    type: ActionTypes.SELECT_POST,
                    postId: ''
                });
            }

            dispatch({
                type: PostTypes.REMOVE_POST,
                data: post
            });

            if (success) {
                success();
            }
        }
    );
}

export function performSearch(terms, isMentionSearch, success, error) {
    Client4.searchPosts(TeamStore.getCurrentId(), terms, isMentionSearch).then(
        (data) => {
            AppDispatcher.handleServerAction({
                type: ActionTypes.RECEIVED_SEARCH,
                results: data,
                is_mention_search: isMentionSearch
            });

            loadProfilesForPosts(data.posts);

            if (success) {
                success(data);
            }
        }
    ).catch(
        (err) => {
            if (error) {
                error(err);
            }
        }
    );
}

const POST_INCREASE_AMOUNT = Constants.POST_CHUNK_SIZE / 2;

// Returns true if there are more posts to load
export function increasePostVisibility(channelId, focusedPostId) {
    return async (doDispatch, doGetState) => {
        if (doGetState().views.channel.loadingPosts[channelId]) {
            return true;
        }

        const currentPostVisibility = doGetState().views.channel.postVisibility[channelId];

        if (currentPostVisibility >= Constants.MAX_POST_VISIBILITY) {
            return true;
        }

        doDispatch(batchActions([
            {
                type: ActionTypes.LOADING_POSTS,
                data: true,
                channelId
            },
            {
                type: ActionTypes.INCREASE_POST_VISIBILITY,
                data: channelId,
                amount: POST_INCREASE_AMOUNT
            }
        ]));

        const page = Math.floor(currentPostVisibility / POST_INCREASE_AMOUNT);

        let posts;
        if (focusedPostId) {
            posts = await PostActions.getPostsBefore(channelId, focusedPostId, page, POST_INCREASE_AMOUNT)(dispatch, getState);
        } else {
            posts = await PostActions.getPosts(channelId, page, POST_INCREASE_AMOUNT)(doDispatch, doGetState);
        }

        doDispatch({
            type: ActionTypes.LOADING_POSTS,
            data: false,
            channelId
        });

        return posts.order.length >= POST_INCREASE_AMOUNT;
    };
}

export function searchForTerm(term) {
    AppDispatcher.handleServerAction({
        type: ActionTypes.RECEIVED_SEARCH_TERM,
        term,
        do_search: true
    });
}
