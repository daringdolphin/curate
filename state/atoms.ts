import { create } from 'zustand'
import { FileMeta } from '@/types'

export interface DrivePickerState {
  isLoading: boolean
  selectedFolderId: string | null
  folderName: string | null
  accessToken: string | null
}

export interface FileSelectionState {
  selectedFiles: Set<string>
  expandedNodes: Set<string>
}

export interface TokenState {
  tokenCounts: Map<string, number>
  totalTokens: number
  softCap: number
  hardCap: number
}

export interface UIPrefsState {
  theme: 'light' | 'dark' | 'system'
  sortOrder: 'name' | 'tokens' | 'modified'
  searchQuery: string
}

// Combined state interface
interface AppState {
  // File metadata
  filesMeta: FileMeta[]
  filesLoading: boolean
  
  // Drive picker state
  drivePickerState: DrivePickerState
  
  // File selection state
  fileSelectionState: FileSelectionState
  
  // Token state
  tokenState: TokenState
  
  // UI preferences
  uiPrefsState: UIPrefsState
  
  // Actions
  setFilesMeta: (files: FileMeta[]) => void
  setFilesLoading: (loading: boolean) => void
  setDrivePickerState: (state: DrivePickerState) => void
  setFileSelectionState: (state: FileSelectionState) => void
  setTokenState: (state: TokenState) => void
  setUIPrefsState: (state: UIPrefsState) => void
  resetState: () => void
}

// Create Zustand store
export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  filesMeta: [],
  filesLoading: false,
  drivePickerState: {
    isLoading: false,
    selectedFolderId: null,
    folderName: null,
    accessToken: null
  },
  fileSelectionState: {
    selectedFiles: new Set(),
    expandedNodes: new Set()
  },
  tokenState: {
    tokenCounts: new Map(),
    totalTokens: 0,
    softCap: 750000, // 750k tokens
    hardCap: 1000000 // 1M tokens
  },
  uiPrefsState: {
    theme: 'system',
    sortOrder: 'name',
    searchQuery: ''
  },
  
  // Actions
  setFilesMeta: (files) => set({ filesMeta: files }),
  setFilesLoading: (loading) => set({ filesLoading: loading }),
  setDrivePickerState: (state) => set({ drivePickerState: state }),
  setFileSelectionState: (state) => set({ fileSelectionState: state }),
  setTokenState: (state) => set({ tokenState: state }),
  setUIPrefsState: (state) => set({ uiPrefsState: state }),
  resetState: () => set({
    filesMeta: [],
    filesLoading: false,
    drivePickerState: {
      isLoading: false,
      selectedFolderId: null,
      folderName: null,
      accessToken: null
    },
    fileSelectionState: {
      selectedFiles: new Set(),
      expandedNodes: new Set()
    },
    tokenState: {
      tokenCounts: new Map(),
      totalTokens: 0,
      softCap: 750000,
      hardCap: 1000000
    },
    uiPrefsState: {
      theme: 'system',
      sortOrder: 'name',
      searchQuery: ''
    }
  })
})) 