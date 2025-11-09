// /app/components/Footer.tsx

// Next.jsのServer Componentとして動作します

export default function Footer() {
    return (
        <footer style={{ 
            backgroundColor: '#f1f1f1', 
            color: '#333', 
            padding: '20px', 
            textAlign: 'center', 
            marginTop: '40px',
            borderTop: '1px solid #ccc' 
        }}>
            <p style={{ margin: '5px 0' }}>&copy; {new Date().getFullYear()} BIC-SAVING. All rights reserved.</p>
            <nav>
                <a href="#" style={{ color: '#0070f3', margin: '0 10px', textDecoration: 'none' }}>利用規約</a>
                <a href="#" style={{ color: '#0070f3', margin: '0 10px', textDecoration: 'none' }}>プライバシーポリシー</a>
            </nav>
        </footer>
    );
}