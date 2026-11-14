/**
 * Live Web Search Service
 * Real-time web retrieval via DuckDuckGo Instant Answer API & search aggregation
 */

export async function performWebSearch(query) {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) return { summary: '', results: [] };

  try {
    const encoded = encodeURIComponent(cleanQuery);
    // 1. Fetch from DuckDuckGo Instant Answers API
    const ddgUrl = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgUrl);
    
    let summary = '';
    const results = [];

    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText) {
        summary = data.AbstractText;
        results.push({
          title: data.Heading || cleanQuery,
          snippet: data.AbstractText,
          url: data.AbstractURL || `https://duckduckgo.com/?q=${encoded}`,
          source: data.AbstractSource || 'DuckDuckGo Knowledge'
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, 4).forEach((topic) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || cleanQuery,
              snippet: topic.Text,
              url: topic.FirstURL,
              source: new URL(topic.FirstURL).hostname.replace('www.', '')
            });
          }
        });
      }
    }

    // 2. If DDG had no abstract, query Wikipedia API for instant factual grounding
    if (results.length === 0) {
      try {
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData.extract) {
            summary = wikiData.extract;
            results.push({
              title: wikiData.title || cleanQuery,
              snippet: wikiData.extract,
              url: wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}`,
              source: 'wikipedia.org'
            });
          }
        }
      } catch (e) {}
    }

    return {
      query: cleanQuery,
      summary,
      results
    };
  } catch (err) {
    console.warn('Web search request failed:', err);
    return {
      query: cleanQuery,
      summary: '',
      results: []
    };
  }
}
