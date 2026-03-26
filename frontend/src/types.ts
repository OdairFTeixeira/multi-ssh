import { model } from '../wailsjs/go/models'

export type Connection = model.Connection
export type SplitMode = 'none' | 'horizontal' | 'vertical'

export interface Pane {
    selectedIndex: number
    sessionId: string | null
}
