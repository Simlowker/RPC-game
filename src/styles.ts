import styled from 'styled-components'

export const MainWrapper = styled.main`
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`

export const TosWrapper = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
`

export const TosInner = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  
  p {
    margin-bottom: 12px;
  }
  
  b {
    color: #333;
    font-weight: 600;
  }
`