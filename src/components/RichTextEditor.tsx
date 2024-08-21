/* eslint-disable react/no-unstable-default-props */
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react'

import type { AnyExtension, Editor as CoreEditor } from '@tiptap/core'
import type { UseEditorOptions } from '@tiptap/react'
import { EditorContent, useEditor } from '@tiptap/react'
import { differenceBy, throttle } from 'lodash-unified'

import type { BubbleMenuProps } from '@/types'
import { BubbleMenu, Toolbar, TooltipProvider } from '@/components'
import { EDITOR_UPDATE_WATCH_THROTTLE_WAIT_TIME } from '@/constants'
import { useLocale } from '@/locales'
import { themeActions } from '@/theme/theme'
import { hasExtension } from '@/utils/utils'

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
  /** Editor class */
  editorClass?: string | string[] | Record<string, any>
  /** Content class */
  contentClass?: string | string[] | Record<string, any>
  /** Content change callback */
  onChangeContent?: (val: any) => void
  /** Bubble menu props */
  bubbleMenu?: BubbleMenuProps

  /** Use editor options */
  useEditorOptions?: UseEditorOptions
}

function RichTextEditor(props: RichTextEditorProps, ref: React.ForwardedRef<{ editor: CoreEditor | null }>) {
  const { content, extensions, useEditorOptions = {} } = props
  const { t } = useLocale()

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

  const onValueChange = throttle((editor) => {
    const output = getOutput(editor, props.output as any)

    props?.onChangeContent?.(output as any)
  }, EDITOR_UPDATE_WATCH_THROTTLE_WAIT_TIME)

  const editor = useEditor({
    extensions: sortExtensions,
    content,
    onUpdate: ({ editor }) => {
      if (onValueChange)
        onValueChange(editor)
    },
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

  function getOutput(editor: CoreEditor, output: RichTextEditorProps['output']) {
    if (props?.removeDefaultWrapper) {
      if (output === 'html') {
        return editor.isEmpty ? '' : editor.getHTML()
      }
      if (output === 'json') {
        return editor.isEmpty ? {} : editor.getJSON()
      }
      if (output === 'text') {
        return editor.isEmpty ? '' : editor.getText()
      }
      return ''
    }

    if (output === 'html') {
      return editor.getHTML()
    }
    if (output === 'json') {
      return editor.getJSON()
    }
    if (output === 'text') {
      return editor.getText()
    }
    return ''
  }

  useEffect(() => {
    return () => {
      editor?.destroy?.()
    }
  }, [])

  const hasExtensionValue = hasExtension(editor as any, 'characterCount')

  if (!editor) {
    return <></>
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="reactjs-tiptap-editor richtext-rounded-[0.5rem] richtext-bg-background richtext-shadow richtext-overflow-hidden richtext-outline richtext-outline-1">
        {!props?.hideBubble && <BubbleMenu bubbleMenu={props?.bubbleMenu} editor={editor} disabled={props?.disabled} />}

        <div className="richtext-flex richtext-flex-col richtext-w-full richtext-max-h-full">
          {!props?.hideToolbar && <Toolbar editor={editor} disabled={!!props?.disabled} />}

          <EditorContent className={`richtext-relative ${props?.contentClass || ''}`} editor={editor} />

          <div className="richtext-flex richtext-items-center richtext-justify-between richtext-p-3 richtext-border-t">
            {hasExtensionValue && (
              <div className="richtext-flex richtext-flex-col">
                <div className="richtext-flex richtext-justify-end richtext-gap-3 richtext-text-sm">
                  <span>
                    {(editor as any).storage.characterCount.characters()}
                    {' '}
                    {t('editor.characters')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default forwardRef(RichTextEditor)