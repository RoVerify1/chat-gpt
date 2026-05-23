<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XerionX - Start</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #e67e22 100%);
            min-height: 100vh;
            color: #2d3748;
        }

        .navbar {
            background: rgba(255, 255, 255, 0.98);
            padding: 1.2rem 5%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .logo {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1e3a5f;
            letter-spacing: -0.5px;
        }

        .logo span {
            color: #e67e22;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
        }

        .nav-links a {
            text-decoration: none;
            color: #4a5568;
            font-weight: 500;
            font-size: 0.95rem;
            transition: color 0.3s;
            position: relative;
        }

        .nav-links a:hover {
            color: #1e3a5f;
        }

        .nav-links a::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 0;
            height: 2px;
            background: #e67e22;
            transition: width 0.3s;
        }

        .nav-links a:hover::after {
            width: 100%;
        }

        .hero {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 75vh;
            padding: 2rem;
        }

        .hero-content {
            background: rgba(255, 255, 255, 0.98);
            padding: 4rem 3.5rem;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            max-width: 700px;
            text-align: center;
        }

        .hero h1 {
            font-size: 2.8rem;
            margin-bottom: 1rem;
            color: #1e3a5f;
            font-weight: 700;
            line-height: 1.2;
        }

        .hero p {
            font-size: 1.15rem;
            color: #718096;
            margin-bottom: 2.5rem;
            line-height: 1.6;
        }

        .cta-button {
            display: inline-block;
            padding: 1rem 2.5rem;
            background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s;
            box-shadow: 0 4px 6px rgba(230, 126, 34, 0.3);
        }

        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(230, 126, 34, 0.4);
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            padding: 4rem 5%;
            background: rgba(255, 255, 255, 0.05);
        }

        .feature-card {
            background: white;
            padding: 2.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            transition: transform 0.3s, box-shadow 0.3s;
            border: 1px solid rgba(0,0,0,0.05);
        }

        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #1e3a5f, #2d5a87);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
        }

        .feature-card h3 {
            font-size: 1.3rem;
            color: #1e3a5f;
            margin-bottom: 0.75rem;
            font-weight: 600;
        }

        .feature-card p {
            color: #718096;
            line-height: 1.6;
            font-size: 0.95rem;
        }

        footer {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.95);
            color: #718096;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .hero-content {
                padding: 2.5rem 2rem;
            }
            
            .hero h1 {
                font-size: 2rem;
            }
            
            .nav-links {
                gap: 1.2rem;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="logo">Xerion<span>X</span></div>
        <div class="nav-links">
            <a href="index.php">Home</a>
            <a href="login.php">Login</a>
            <a href="register.php">Register</a>
        </div>
    </nav>

    <section class="hero">
        <div class="hero-content">
            <h1>Willkommen bei XerionX</h1>
            <p>Moderne Lösungen für deine Anforderungen. Schnell, zuverlässig und benutzerfreundlich - alles was du brauchst, an einem Ort.</p>
            <a href="register.php" class="cta-button">Kostenlos starten</a>
        </div>
    </section>

    <section class="features">
        <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Schnell & Effizient</h3>
            <p>Optimierte Prozesse und moderne Technologie für beste Performance.</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Sicher & Zuverlässig</h3>
            <p>Deine Daten sind bei uns in sicheren Händen. Höchste Sicherheitsstandards.</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>Benutzerfreundlich</h3>
            <p>Intuitive Bedienung und durchdachtes Design für ein optimales Erlebnis.</p>
        </div>
    </section>

    <footer>
        <p>&copy; <?php echo date('Y'); ?> XerionX. Alle Rechte vorbehalten.</p>
    </footer>
</body>
</html>
