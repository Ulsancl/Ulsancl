/**
 * ErrorBoundary - 에러 바운더리 컴포넌트
 * 컴포넌트 에러를 잡아서 폴백 UI 표시
 */
import React, { Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo })

        // 에러 로깅 (프로덕션에서는 에러 트래킹 서비스로 전송)
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        // 페이지 새로고침 옵션
        if (this.props.onReset) {
            this.props.onReset()
        }
    }

    render() {
        if (this.state.hasError) {
            // 커스텀 폴백 UI
            if (this.props.fallback) {
                return this.props.fallback({
                    error: this.state.error,
                    errorInfo: this.state.errorInfo,
                    reset: this.handleReset
                })
            }

            // 기본 폴백 UI
            return (
                <div style={styles.container}>
                    <div style={styles.card}>
                        <div style={styles.icon}>⚠️</div>
                        <h2 style={styles.title}>문제가 발생했습니다</h2>
                        <p style={styles.message}>
                            예기치 않은 오류가 발생했습니다.
                            <br />
                            아래 버튼을 눌러 다시 시도해 주세요.
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <details style={styles.details}>
                                <summary style={styles.summary}>오류 상세 정보</summary>
                                <pre style={styles.errorText}>
                                    {this.state.error?.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div style={styles.actions}>
                            <button style={styles.button} onClick={this.handleReset}>
                                다시 시도
                            </button>
                            <button
                                style={{ ...styles.button, ...styles.secondaryButton }}
                                onClick={() => window.location.reload()}
                            >
                                페이지 새로고침
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 100%)',
        color: '#e5e7eb'
    },
    card: {
        background: 'rgba(26, 26, 46, 0.9)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
    },
    icon: {
        fontSize: '48px',
        marginBottom: '20px'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: '600',
        marginBottom: '12px',
        color: '#f3f4f6'
    },
    message: {
        fontSize: '0.95rem',
        color: '#9ca3af',
        lineHeight: '1.6',
        marginBottom: '24px'
    },
    details: {
        textAlign: 'left',
        marginBottom: '24px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        padding: '12px'
    },
    summary: {
        cursor: 'pointer',
        color: '#f87171',
        fontWeight: '500',
        marginBottom: '8px'
    },
    errorText: {
        fontSize: '0.75rem',
        color: '#ef4444',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '200px',
        overflow: 'auto',
        marginTop: '8px'
    },
    actions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center'
    },
    button: {
        padding: '12px 24px',
        fontSize: '0.9rem',
        fontWeight: '600',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        color: 'white',
        transition: 'all 0.2s ease'
    },
    secondaryButton: {
        background: 'transparent',
        border: '1px solid rgba(99, 102, 241, 0.5)',
        color: '#a5b4fc'
    }
}

export default ErrorBoundary
