import React, { FC, useEffect, useState } from "react"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"

interface AutoCompleteProps {
  results: AutoCompleteStructure[] | null
  handleHover: (index: number) => void
  selectedSuggestion: number
  userInput: string
}

interface AutoCompleteStructure {
  suggestion: string
  relevance: number
  highlights: [{ start: number; end: number }]
}

export const AutoCompleteContainer: FC<AutoCompleteProps> = ({
  results,
  handleHover,
  selectedSuggestion
}) => {
  const { handleInputChange } = usePromptAndCommand()

  return (
    results && (
      <ul className="z-10 size-full max-h-[384px] overflow-auto rounded-t-xl bg-red-300 sm:w-[400px] md:w-[500px] lg:w-[660px] xl:w-[800px]">
        {results.map((result, index) => {
          const { suggestion, relevance, highlights } = result
          const suggestionArray = [...suggestion]

          const highlightsIndex = highlights.map(object => {
            const { start, end } = object
            return [start, end]
          })

          return (
            <li
              className={`flex h-12 w-full cursor-pointer items-center border ${selectedSuggestion === index ? "bg-slate-500" : "bg-background"} hover:bg-slate-500`}
              key={suggestion}
              onClick={() => {
                handleInputChange(suggestion)
              }}
              onMouseEnter={() => handleHover(index)}
            >
              <p className="w-full truncate p-1 pl-3">
                {suggestionArray?.map((letter, index) => {
                  for (
                    let counter = 0;
                    counter < suggestionArray.length;
                    counter++
                  ) {
                    if (highlightsIndex.length === 0) {
                      return <span key={index}>{letter}</span>
                    }

                    for (
                      let arrNumber = 0;
                      arrNumber < highlightsIndex.length;
                      arrNumber++
                    ) {
                      if (
                        highlightsIndex[arrNumber][0] <= index &&
                        index <= highlightsIndex[arrNumber][1]
                      ) {
                        return (
                          <>
                            <strong key={index} className="text-blue-500">
                              {letter}
                            </strong>
                          </>
                        )
                      }
                    }
                    return <span key={index}>{letter}</span>
                  }
                })}
              </p>
            </li>
          )
        })}
      </ul>
    )
  )
}
