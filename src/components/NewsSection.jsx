import React, { memo } from 'react'
import NewsFeed from './NewsFeed'

const NewsSection = memo(function NewsSection({ news, onNewsClick }) {
  return (
    <section className="news-section">
      <NewsFeed news={news} onNewsClick={onNewsClick} />
    </section>
  )
})

export default NewsSection
