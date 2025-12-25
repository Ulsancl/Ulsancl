import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 외부 접속 허용 (핸드폰에서 접속 가능)
    port: 7777, // 포트 고정 (다른 게임과 겹치지 않음)
    strictPort: true, // 7777이 사용 중이면 실행 실패 (실수로 다른 포트 사용 방지)
    hmr: {
      overlay: true // HMR 에러를 화면에 표시
    },
    watch: {
      usePolling: true, // 파일 변경 감지 강화 (Windows에서 더 안정적)
      interval: 100 // 100ms마다 파일 변경 확인
    }
  },
  // 개발 모드에서 캐시 비활성화
  optimizeDeps: {
    force: true // 의존성 사전 번들링 강제 (캐시 무시)
  }
})
