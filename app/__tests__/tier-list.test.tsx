import { render, screen } from '@testing-library/react'
import TierList from '../tier-list/page'

describe('TierList', () => {
  it('renders the tier list with teams', () => {
    render(<TierList />)

    // Check if the title is rendered
    expect(screen.getByText('Évaluateur d\'Équipes FC (1-10)')).toBeInTheDocument()

    // Check if some teams are rendered
    expect(screen.getByText('Real Madrid')).toBeInTheDocument()
    expect(screen.getByText('Barcelona')).toBeInTheDocument()

    // Check if tiers are rendered
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('renders all teams in 5 tier initially', () => {
    render(<TierList />)

    // The 5 tier should contain all teams initially
    const tier5 = screen.getByText('5').closest('div')
    expect(tier5).toBeInTheDocument()

    // Check that Real Madrid is in the 5 tier
    expect(tier5?.textContent).toContain('Real Madrid')
  })
})