/* eslint-disable react/no-unstable-default-props */
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react'

import type { AnyExtension, Editor as CoreEditor } from '@tiptap/core'
import type { UseEditorOptions } from '@tiptap/react'
import { EditorContent, useEditor } from '@tiptap/react'
import { differenceBy } from 'lodash-es'

import type { BubbleMenuProps } from '@/types'
import { TooltipProvider } from '@/components'
import { RESET_CSS } from '@/constants/resetCSS'
import { themeActions } from '@/theme/theme'
import { removeCSS, updateCSS } from '@/utils/dynamicCSS'

import '../styles/index.scss'

/**
 * Interface for RichTextEditor component props
 */
export interface RichTextEditorProps {
  /** Content of the editor */
  content: string
  /** Extensions for the editor */
  extensions: AnyExtension[]

  /** Output format */
  output: 'html' | 'json' | 'text'
  /** Model value */
  modelValue?: string | object
  /** Dark mode flag */
  dark?: boolean
  /** Dense mode flag */
  dense?: boolean
  /** Disabled flag */
  disabled?: boolean
  /** Label for the editor */
  label?: string
  /** Hide toolbar flag */
  hideToolbar?: boolean
  /** Disable bubble menu flag */
  disableBubble?: boolean
  /** Hide bubble menu flag */
  hideBubble?: boolean
  /** Remove default wrapper flag */
  removeDefaultWrapper?: boolean
  /** Maximum width */
  maxWidth?: string | number
  /** Minimum height */
  minHeight?: string | number
  /** Maximum height */
  maxHeight?: string | number
  /** Content class */
  contentClass?: string | string[] | Record<string, any>
  /** Content change callback */
  onChangeContent?: (val: any) => void
  /** Bubble menu props */
  bubbleMenu?: BubbleMenuProps

  /** Use editor options */
  useEditorOptions?: UseEditorOptions

  /** Use editor options */
  resetCSS?: boolean
}

function RenderContent(props: RichTextEditorProps, ref: React.ForwardedRef<{ editor: CoreEditor | null }>) {
  const { content, extensions, useEditorOptions = {} } = props

  const sortExtensions = useMemo(() => {
    const diff = differenceBy(extensions, extensions, 'name')
    const exts = extensions.map((k: any) => {
      const find = extensions.find((ext: any) => ext.name === k.name)
      if (!find) {
        return k
      }
      return k.configure(find.options)
    })
    return [...exts, ...diff].map((k, i) => k.configure({ sort: i }))
  }, [extensions])

  const editor = useEditor({
    extensions: sortExtensions,
    content,
    ...useEditorOptions,
  })

  useImperativeHandle(ref, () => {
    return {
      editor,
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', props.dark)
    themeActions.setTheme(props.dark ? 'dark' : 'light')
  }, [props.dark])

  useEffect(() => {
    editor?.setEditable(!props?.disabled)
  }, [editor, props?.disabled])

  useEffect(() => {
    if (props?.resetCSS !== false) {
      updateCSS(RESET_CSS, 'react-tiptap-reset')
    }

    return () => {
      removeCSS('react-tiptap-reset')
    }
  }, [props?.resetCSS])

  useEffect(() => {
    return () => {
      editor?.destroy?.()
    }
  }, [])

  if (!editor) {
    return <></>
  }

  return (
    <div className="reactjs-tiptap-editor">
      <TooltipProvider delayDuration={0} disableHoverableContent>
        <div className="richtext-rounded-[0.5rem] richtext-bg-background richtext-shadow richtext-overflow-hidden">

          <div className="richtext-flex richtext-flex-col richtext-w-full richtext-max-h-full">

            <EditorContent className={`richtext-relative ${props?.contentClass || ''}`} editor={editor} />

          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}

export default forwardRef(RenderContent)
