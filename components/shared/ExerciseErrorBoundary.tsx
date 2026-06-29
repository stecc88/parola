'use client'

import { Component, type ReactNode } from 'react'
import { ErrorBoundaryContent } from './ErrorBoundaryContent'

interface State {
  error: (Error & { digest?: string }) | null
}

export class ExerciseErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error: error as Error & { digest?: string } }
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <ErrorBoundaryContent
          error={this.state.error}
          reset={this.reset}
          contesto="esercizio"
          tornaHref="/student/exercises"
          tornaLabel="Torna agli esercizi"
        />
      )
    }
    return this.props.children
  }
}
