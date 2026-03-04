import type { AppProps } from 'next/app'
import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Rajdhani:wght@300;500;600;700&family=Outfit:wght@300;400;600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
    </Head>
    <Component {...pageProps} />
  </>
}
