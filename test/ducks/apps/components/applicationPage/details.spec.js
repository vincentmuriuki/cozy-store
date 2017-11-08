'use strict'

/* eslint-env jest */

import React from 'react'
import { shallow } from 'enzyme'

import { tMock } from '../../../../jestLib/I18n'
import { Details } from 'ducks/apps/components/ApplicationPage/Details'

import mockApp from '../../_mockPhotosRegistryVersion'

const appManifest = mockApp.manifest

const getProps = () => {
  return {
    t: tMock,
    description: appManifest.locales.en.long_description,
    changes: appManifest.locales.en.changes,
    category: appManifest.category,
    langs: appManifest.langs,
    mobileApps: [{type: 'ios', url: ''}, {type: 'android', url: 'https://mock.app'}],
    developer: appManifest.developer
  }
}

describe('ApplicationPage details component', () => {
  it('should be rendered correctly with provided app', () => {
    const component = shallow(
      <Details {...getProps()} />
    ).node
    expect(component).toMatchSnapshot()
  })

  it('should be rendered correctly provided app with no description, no platforms, no category, no langs and no changes', () => {
    const appProps = Object.assign({}, getProps())
    appProps.description = ''
    appProps.changes = ''
    appProps.category = ''
    appProps.langs = []
    appProps.mobileApps = []
    appProps.developer = {}
    const component = shallow(
      <Details {...appProps} />
    ).node
    expect(component).toMatchSnapshot()
  })

  it('should handle correctly `display more` behaviour on description part', () => {
    const component = shallow(
      <Details {...getProps()} />
    )
    component.find('.sto-app-description .sto-details-display-more').simulate('click')
    expect(component.node).toMatchSnapshot()
  })

  it('should handle correctly `display more` behaviour on changes part', () => {
    const component = shallow(
      <Details {...getProps()} />
    )
    component.find('.sto-app-changes .sto-details-display-more').simulate('click')
    expect(component.node).toMatchSnapshot()
  })
})
