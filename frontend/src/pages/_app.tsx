// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.
import Head from 'next/head'
import Script from 'next/script'
import type {AppProps} from 'next/app'
import {useCallback} from 'react'
import dynamic from 'next/dynamic'
import '@cloudscape-design/global-styles/index.css'
import './App.css'

import {QueryClient, QueryClientProvider} from 'react-query'
import {I18nextProvider, useTranslation} from 'react-i18next'
import {Provider} from 'react-redux'
import ErrorBoundary from '../components/ErrorBoundary'

import i18n from '../i18n'
import {store} from '../store'
import {logger, LoggerProvider} from '../logger/LoggerProvider'
import {enableHttpLogs} from '../http/httpLogs'
import {axiosInstance} from '../http/executeRequest'
import {HelpPanelProvider} from '../components/help-panel/HelpPanel'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})
declare global {
  interface Window {
    ace: any
    editor: any
  }
}

enableHttpLogs(axiosInstance, logger)

function App({Component, pageProps}: AppProps) {
  const {t} = useTranslation()

  const onAceLoad = useCallback(() => {
    window.editor = window.ace.edit('editor')
    window.ace.config.set('basePath', '/third-party/ace-1.4.13/')
    window.ace.config.set('loadWorkerFromBlob', false)
    window.ace.config.set('showFoldWidgets', false)
    window.ace.config.set('showPrintMargin', false)
    window.ace.config.set('useStrictCSP', true)
  }, [])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{t('global.projectDisplayName')}</title>
      </Head>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Provider store={store}>
            <LoggerProvider>
              <ErrorBoundary>
                <HelpPanelProvider>
                  <Component {...pageProps} />
                </HelpPanelProvider>
              </ErrorBoundary>
            </LoggerProvider>
          </Provider>
        </I18nextProvider>
      </QueryClientProvider>
      <div id="editor"></div>
      <Script
        src="/third-party/ace-1.4.13/ace.min.js"
        onLoad={onAceLoad}
      />
    </>
  )
}

/**
 * Disable SSR
 *
 * This is only here because as of yet we are not
 * relying on NextJS routing and react-router-dom
 * does not play well with SSR.
 *
 * While doing the transition to NextJS routing,
 * we need a way to support both ways of functioning.
 *
 * Please note, this is only useful in the context of
 * local development (`npm run dev`), as this app is
 * currently being built as a static export,
 * thus SSR is not relevant.
 */
export default dynamic(() => Promise.resolve(App), {
  ssr: false,
})
