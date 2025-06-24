import React from 'react'

interface TabProps {
  tabs: string[]
  selectedTab: number
  onTabChange: (index: number) => void
}

// Tab-Komponente für die Umschaltung zwischen verschiedenen Ansichten
const Tab: React.FC<TabProps> = ({tabs, selectedTab, onTabChange}) => {
  return (
    <div className="tab-container">
      {tabs.map((tab, idx) => (
        <button
          key={tab}
          className={`tab-button${selectedTab === idx ? ' active' : ''}`}
          onClick={() => onTabChange(idx)}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export default Tab 