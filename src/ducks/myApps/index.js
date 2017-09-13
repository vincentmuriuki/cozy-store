/* eslint-env browser */
/* global cozy */

import { combineReducers } from 'redux'
import { currentAppVersionReducers } from '../currentAppVersion'

import {
  UnavailableStackException,
  NotUninstallableAppException
} from '../../lib/exceptions'

const NOT_REMOVABLE_APPS = ['drive', 'collect']
const NOT_DISPLAYED_APPS = ['settings', 'store', 'onboarding']

const FETCH_APPS = 'FETCH_APPS'
const FETCH_APPS_SUCCESS = 'FETCH_APPS_SUCCESS'
const FETCH_APPS_FAILURE = 'FETCH_APPS_FAILURE'

const FETCH_REGISTRY_APPS_SUCCESS = 'FETCH_REGISTRY_APPS_SUCCESS'

const UNINSTALL_APP_SUCCESS = 'UNINSTALL_APP_SUCCESS'
const UNINSTALL_APP_FAILURE = 'UNINSTALL_APP_FAILURE'

const list = (state = [], action) => {
  switch (action.type) {
    case FETCH_REGISTRY_APPS_SUCCESS:
      return _consolidateApps(state, action.apps)
    case FETCH_APPS_SUCCESS:
      return _consolidateApps(state, action.apps)
    case UNINSTALL_APP_SUCCESS:
      return action.apps
    default:
      return state
  }
}

const isFetching = (state = false, action) => {
  switch (action.type) {
    case FETCH_APPS:
      return true
    case FETCH_APPS_SUCCESS:
    case FETCH_APPS_FAILURE:
      return false
    default:
      return state
  }
}

export const error = (state = null, action) => {
  switch (action.type) {
    case FETCH_APPS_FAILURE:
    case UNINSTALL_APP_FAILURE:
      return action.error
    default:
      return state
  }
}

export const appsReducers = combineReducers({
  list,
  error,
  isFetching,
  currentAppVersion: currentAppVersionReducers
})

export function getInstalledApps (state) {
  return state.apps.list.filter(app => app.installed)
}

async function _getIcon (url) {
  if (!url) return ''
  const icon = await cozy.client.fetchJSON('GET', url)

  try {
    return 'data:image/svg+xml;base64,' + btoa(icon)
  } catch (e) { // eslint-disable-line
    try {
      return URL.createObjectURL(icon)
    } catch (e) {
      return ''
    }
  }
}

function _consolidateApps (stateApps, newAppsInfos) {
  const apps = new Map()
  stateApps.forEach(app => apps.set(app.slug, app))
  newAppsInfos.forEach(app => {
    const appsFromState = apps.get(app.slug)
    if (appsFromState) {
      apps.set(app.slug, Object.assign({}, appsFromState, app))
    } else {
      apps.set(app.slug, app)
    }
  })
  return Array.from(apps.values()).filter(app => app)
}

export function fetchMyApps () {
  return (dispatch, getState) => {
    dispatch({type: FETCH_APPS})
    return cozy.client.fetchJSON('GET', '/apps/')
    .then(myApps => {
      myApps = myApps.filter(app => !NOT_DISPLAYED_APPS.includes(app.attributes.slug))
      Promise.all(myApps.map(app => {
        return _getIcon(app.links.icon)
        .then(iconData => {
          return Object.assign({}, app.attributes, {
            _id: app.id,
            icon: iconData,
            installed: true,
            uninstallable: !NOT_REMOVABLE_APPS.includes(app.attributes.slug)
          })
        })
      }))
      .then(apps => {
        return dispatch({type: FETCH_APPS_SUCCESS, apps})
      })
    })
    .catch(e => {
      dispatch({type: FETCH_APPS_FAILURE, error: e})
      throw new UnavailableStackException()
    })
  }
}

export function fetchRegistryApps (lang = 'en') {
  return (dispatch, getState) => {
    dispatch({type: FETCH_APPS})
    return cozy.client.fetchJSON('GET', '/registry?filter[type]=webapp')
    .then(response => {
      const apps = response.data
      .filter(app => !NOT_DISPLAYED_APPS.includes(app.name))
      .filter(app => app.versions.dev && app.versions.dev.length) // only apps with versions available
      return Promise.all(apps.map(app => {
        const appName = (app.full_name && (app.full_name[lang] || app.full_name.en)) || app.name
        const appDesc = (app.description && (app.description[lang] || app.description.en)) || ''
        return _getIcon(app.logo_url)
        .then(iconData => {
          return Object.assign({}, app, {
            slug: app.name,
            icon: iconData,
            name: appName,
            installed: false,
            description: appDesc,
            uninstallable: true,
            isInRegistry: true
          })
        })
      }))
      .then(apps => {
        return dispatch({type: FETCH_REGISTRY_APPS_SUCCESS, apps})
      })
    })
    .catch(e => {
      dispatch({type: FETCH_APPS_FAILURE, error: e})
      throw new UnavailableStackException()
    })
  }
}

export function fetchApps (lang) {
  return (dispatch, getState) => {
    dispatch(fetchRegistryApps(lang))
    .then(() => dispatch(fetchMyApps()))
  }
}

export function uninstallApp (slug) {
  return (dispatch, getState) => {
    if (NOT_REMOVABLE_APPS.includes(slug) || NOT_DISPLAYED_APPS.includes(slug)) {
      return Promise.reject(new NotUninstallableAppException())
    }
    return cozy.client.fetchJSON('DELETE', `/apps/${slug}`)
    .then(() => {
      // remove the app from the state apps list
      const apps = getState().apps.list.map(app => {
        if (app.slug === slug) app.installed = false
        return app
      })
      dispatch({type: UNINSTALL_APP_SUCCESS, apps})
      return dispatch({
        type: 'SEND_LOG_SUCCESS',
        alert: {
          message: 'app_modal.uninstall.message.success',
          level: 'success'
        }
      })
    })
    .catch(e => {
      dispatch({type: UNINSTALL_APP_FAILURE, error: e})
      throw new UnavailableStackException()
    })
  }
}
