import { ServerRuntime } from "next"

export const runtime: ServerRuntime = "edge"

const mockSentences: string[] = [
  "What was Apple total revenue in the last fiscal year?",
  "How have Apple iPhone sales trended over the past five quarters?",
  "What are Apple reported margins for its services segment?",
  "Can you provide Apple revenue breakdown by geographic segment for the latest quarter?",
  "What percentage of Apple total revenue came from the Americas last year?",
  "How did Apple wearables, home, and accessories segment perform in the most recent SEC filing?",
  "What was the year-over-year growth in Apple iPad sales?",
  "Can you show the trend in Apple gross margin over the last three years?",
  "What were the R&D expenses for Apple as reported in their latest 10-K?",
  "How does Apple revenue from the Greater China region compare to Europe in the latest fiscal period?",
  "What is the revenue contribution of the Mac segment to Apple total revenue?",
  "Did Apple report any significant changes in inventory levels in their most recent 10-Q?",
  "How has Apple operating margin fluctuated with the introduction of new product lines?",
  "What are the key highlights from Apple management discussion in the last annual report?",
  "Can you detail the revenue growth of Apple software and services segment?",
  "What impact did foreign exchange rates have on Apple international sales figures?",
  "How does Apple segment its revenue from emerging markets versus developed markets?",
  "What are the sales figures for Apple newest product launch as mentioned in their SEC filings?",
  "Can you analyze the trend in Apple net income over the past fiscal year?",
  "What insights can be gathered about Apple market share in the smartphone industry from its SEC filings?"
]

function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
}

function calculateRelevance(query: string, sentence: string): number {
  const queryWords = new Set(normalizeString(query).split(" "))
  const sentenceWords = normalizeString(sentence).split(" ")

  let matchCount = 0
  sentenceWords.forEach(word => {
    if (queryWords.has(word)) {
      matchCount++
    }
  })

  return matchCount
}

type HighlightRange = { start: number; end: number }

function findMatchingWordRanges(
  query: string,
  sentence: string
): HighlightRange[] {
  const normalizedQuery = normalizeString(query)
  const normalizedSentence = normalizeString(sentence)
  const queryWords = normalizedQuery.split(" ")
  const matches: HighlightRange[] = []

  queryWords.forEach(queryWord => {
    if (queryWord.length === 0) return
    let position = normalizedSentence.indexOf(queryWord)
    while (position !== -1) {
      matches.push({ start: position, end: position + queryWord.length })
      position = normalizedSentence.indexOf(
        queryWord,
        position + queryWord.length
      )
    }
  })

  return matches
}

export async function POST(request: Request) {
  const { query } = await request.json()

  // simulate small delay
  await new Promise(resolve => setTimeout(resolve, 400))

  const rankedSuggestions = mockSentences
    .map(suggestion => ({
      suggestion,
      relevance: calculateRelevance(query, suggestion),
      highlights: findMatchingWordRanges(query, suggestion)
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 8)

  return new Response(JSON.stringify(rankedSuggestions), {
    status: 200
  })
}
