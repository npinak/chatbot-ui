import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import {
  IconBolt,
  IconCirclePlus,
  IconPlayerStopFilled,
  IconSend
} from "@tabler/icons-react"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "../ui/input"
import { AutoCompleteContainer } from "./auto-complete-container"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { ChatCommandInput } from "./chat-command-input"
import { ChatFilesDisplay } from "./chat-files-display"
import { useChatHandler } from "./chat-hooks/use-chat-handler"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"
import { useSelectFileHandler } from "./chat-hooks/use-select-file-handler"

interface ChatInputProps {}

interface AutoCompleteStructure {
  suggestion: string
  relevance: number
  highlights: [{ start: number; end: number }]
}

export const ChatInput: FC<ChatInputProps> = ({}) => {
  const { t } = useTranslation()

  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const [isTyping, setIsTyping] = useState<boolean>(false)

  const [autoCompleteResult, setAutoCompleteResult] = useState<
    AutoCompleteStructure[] | null
  >(null)

  const [autoCompleteOpen, setAutoCompleteOpen] = useState<boolean>()
  const autoCompleteRef = useRef<HTMLInputElement>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1)

  const {
    userInput,
    chatMessages,
    isGenerating,
    selectedPreset,
    selectedAssistant,
    focusPrompt,
    setFocusPrompt,
    focusFile,
    focusTool,
    setFocusTool,
    isToolPickerOpen,
    isPromptPickerOpen,
    setIsPromptPickerOpen,
    isAtPickerOpen,
    setFocusFile,
    chatSettings,
    selectedTools,
    setSelectedTools
  } = useContext(ChatbotUIContext)

  const {
    chatInputRef,
    handleSendMessage,
    handleStopMessage,
    handleFocusChatInput
  } = useChatHandler()

  const { handleInputChange } = usePromptAndCommand()

  const handleAutocomplete = async (value: string) => {
    const valueString = userInput.trim()

    if (valueString.length === 0) {
      setAutoCompleteOpen(false)
      setAutoCompleteResult(null)
    }
    const response = await fetch("/api/autocomplete", {
      body: JSON.stringify({ query: value }),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
    const json = await response.json()
    setAutoCompleteResult(json)
  }

  useEffect(() => {
    if (autoCompleteResult !== null) {
      setAutoCompleteOpen(true)
    }
  }, [autoCompleteResult])

  const { filesToAccept, handleSelectDeviceFile } = useSelectFileHandler()

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setTimeout(() => {
      handleFocusChatInput()
    }, 200) // FIX: hacky
  }, [selectedPreset, selectedAssistant])

  useEffect(() => {
    const menuHandler = (event: MouseEvent) => {
      if (
        autoCompleteRef.current !== null &&
        !autoCompleteRef.current.contains(event.target as Node)
      ) {
        if (autoCompleteOpen === true) {
          setAutoCompleteOpen(false)
        } else {
          setAutoCompleteOpen(true)
        }
      }
    }
    document.addEventListener("mousedown", menuHandler)
  }, [autoCompleteOpen])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isTyping && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      setIsPromptPickerOpen(false)
      handleSendMessage(userInput, chatMessages, false)
    }

    if (
      isPromptPickerOpen &&
      (event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault()
      setFocusPrompt(!focusPrompt)
    }

    if (
      isAtPickerOpen &&
      (event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault()
      setFocusFile(!focusFile)
    }

    if (
      isToolPickerOpen &&
      (event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault()
      setFocusTool(!focusTool)
    }

    if (!isTyping && autoCompleteOpen) {
      if (
        autoCompleteResult &&
        event.key === "ArrowDown" &&
        selectedSuggestion < autoCompleteResult?.length - 1
      ) {
        setSelectedSuggestion(prev => prev + 1)
      } else if (event.key === "ArrowUp" && selectedSuggestion > 0) {
        setSelectedSuggestion(prev => prev - 1)
      } else if (
        autoCompleteResult &&
        event.key === "ArrowUp" &&
        selectedSuggestion <= 0
      ) {
        setSelectedSuggestion(autoCompleteResult?.length - 1)
      } else if (
        autoCompleteResult &&
        event.key === "ArrowDown" &&
        selectedSuggestion >= autoCompleteResult?.length - 1
      ) {
        setSelectedSuggestion(0)
      } else {
        setSelectedSuggestion(-1)
      }
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const imagesAllowed = LLM_LIST.find(
      llm => llm.modelId === chatSettings?.model
    )?.imageInput
    if (!imagesAllowed) return

    const items = event.clipboardData.items
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        const file = item.getAsFile()
        if (!file) return
        handleSelectDeviceFile(file)
      }
    }
  }

  return (
    <>
      <ChatFilesDisplay />

      <div className="flex flex-wrap justify-center gap-2">
        {selectedTools &&
          selectedTools.map((tool, index) => (
            <div
              key={index}
              className="mt-2 flex justify-center"
              onClick={() =>
                setSelectedTools(
                  selectedTools.filter(
                    selectedTool => selectedTool.id !== tool.id
                  )
                )
              }
            >
              <div className="flex cursor-pointer items-center justify-center space-x-1 rounded-lg bg-purple-600 px-3 py-1 hover:opacity-50">
                <IconBolt size={20} />

                <div>{tool.name}</div>
              </div>
            </div>
          ))}
      </div>
      {autoCompleteOpen && (
        <div
          ref={autoCompleteRef}
          className={
            "border-input bottom-[60px] z-10 h-[384px] max-h-[384px] w-[300px] overflow-hidden rounded-t-xl border-x-2 border-t-2 sm:w-[400px] md:w-[500px] lg:w-[660px] xl:w-[800px]"
          }
        >
          <AutoCompleteContainer
            results={autoCompleteResult}
            selectedSuggestion={selectedSuggestion}
            handleHover={index => setSelectedSuggestion(index)}
            userInput={userInput}
          />
        </div>
      )}

      <div className="border-input relative flex min-h-[60px] w-full items-center justify-center rounded-b-xl border-2">
        <div className="absolute bottom-[76px] left-0 max-h-[300px] w-full overflow-auto rounded-xl dark:border-none">
          <ChatCommandInput />
        </div>

        <>
          <IconCirclePlus
            className="absolute bottom-[12px] left-3 cursor-pointer p-1 hover:opacity-50"
            size={32}
            onClick={() => fileInputRef.current?.click()}
          />

          {/* Hidden input to select files from device */}
          <Input
            ref={fileInputRef}
            className="hidden"
            type="file"
            onChange={e => {
              if (!e.target.files) return
              handleSelectDeviceFile(e.target.files[0])
            }}
            accept={filesToAccept}
          />
        </>

        <TextareaAutosize
          textareaRef={chatInputRef}
          className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring text-md flex w-full resize-none rounded-md border-none bg-transparent px-14 py-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={t(
            `Ask anything. Type "/" for prompts, "#" for files, and "!" for tools.`
          )}
          onValueChange={value => {
            handleInputChange(value)
            handleAutocomplete(value)
          }}
          value={userInput}
          minRows={1}
          maxRows={18}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsTyping(true)}
          onCompositionEnd={() => setIsTyping(false)}
        />

        <div className="absolute bottom-[14px] right-3 cursor-pointer hover:opacity-50">
          {isGenerating ? (
            <IconPlayerStopFilled
              className="hover:bg-background animate-pulse rounded bg-transparent p-1"
              onClick={handleStopMessage}
              size={30}
            />
          ) : (
            <IconSend
              className={cn(
                "bg-primary text-secondary rounded p-1",
                !userInput && "cursor-not-allowed opacity-50"
              )}
              onClick={() => {
                if (!userInput) return

                handleSendMessage(userInput, chatMessages, false)
              }}
              size={30}
            />
          )}
        </div>
      </div>
    </>
  )
}
