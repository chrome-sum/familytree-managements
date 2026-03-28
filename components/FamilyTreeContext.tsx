'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { TreeData, UserRole } from '@/lib/types'
import { getAuthStatus, logout as logoutAction } from '@/lib/actions-auth'
import LoginModal from './LoginModal'
import SettingsModal from './SettingsModal'

interface FamilyTreeContextType {
  data: TreeData
  rootPersonId: string | null
  highlightPersonId: string | null
  setRootPersonId: (id: string | null) => void
  getSpouses: (personId: string) => TreeData['people']
  getChildren: (unionId: string) => TreeData['people']
  getUnions: (personId: string) => TreeData['unions']
  isLoggedIn: boolean
  setIsLoggedIn: (val: boolean) => void
  userRole: UserRole | null
  canEditTree: boolean
  canManageUsers: boolean
  logout: () => Promise<void>
  isLoginModalOpen: boolean
  setLoginModalOpen: (val: boolean) => void
  isSettingsModalOpen: boolean
  setSettingsModalOpen: (val: boolean) => void
}

const FamilyTreeContext = createContext<FamilyTreeContextType | undefined>(undefined)

export function FamilyTreeProvider({ data, children }: { data: TreeData, children: React.ReactNode }) {
  const [rootId, setRootId] = useState<string | null>(data.people[0]?.id || null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoginModalOpen, setLoginModalOpen] = useState(false)
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false)

  useEffect(() => {
    getAuthStatus().then((status) => {
      setIsLoggedIn(status.isLoggedIn)
      setUserRole(status.role)
    })
  }, [])

  const logout = async () => {
    await logoutAction()
    setIsLoggedIn(false)
    setUserRole(null)
  }

  const selectPerson = (id: string | null) => {
    if (id === rootId) return // Skip if already root
    setRootId(id)
    if (id) {
      setHighlightId(id)
      setTimeout(() => setHighlightId(null), 3000) // Highlight for 3 seconds
    }
  }

  const getUnions = (personId: string) => {
    return data.unions.filter(u => u.partner1_id === personId || u.partner2_id === personId)
  }

  const getSpouses = (personId: string) => {
    const unions = getUnions(personId)
    const spouseIds = unions.map(u => u.partner1_id === personId ? u.partner2_id : u.partner1_id)
    return data.people.filter(p => spouseIds.includes(p.id))
  }

  const getChildren = (unionId: string) => {
    const childIds = data.parentChild.filter(pc => pc.union_id === unionId).map(pc => pc.child_id)
    return data.people.filter(p => childIds.includes(p.id))
  }

  const canEditTree = userRole === 'admin' || userRole === 'editor'
  const canManageUsers = userRole === 'admin'

  return (
    <FamilyTreeContext.Provider value={{ 
      data, 
      rootPersonId: rootId, 
      setRootPersonId: selectPerson,
      highlightPersonId: highlightId,
      getSpouses, 
      getChildren, 
      getUnions,
      isLoggedIn,
      setIsLoggedIn,
      userRole,
      canEditTree,
      canManageUsers,
      logout,
      isLoginModalOpen,
      setLoginModalOpen,
      isSettingsModalOpen,
      setSettingsModalOpen
    }}>
      {children}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
        onLoginSuccess={(role) => {
          setIsLoggedIn(true)
          setUserRole(role)
        }}
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setSettingsModalOpen(false)} 
      />
    </FamilyTreeContext.Provider>
  )
}

export function useFamilyTree() {
  const context = useContext(FamilyTreeContext)
  if (!context) throw new Error('useFamilyTree must be used within FamilyTreeProvider')
  return context
}
