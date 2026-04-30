--[[
    Roblox Account Linking - Verification System
    Dieses Script muss in einem ServerScriptService oder StarterPlayerScripts platziert werden.
    
    WICHTIG: HttpService muss in den Game Settings aktiviert sein!
    (Game Settings -> Security -> Allow HTTP Requests)
]]

local HttpService = game:GetService("HttpService")

-- KONFIGURATION
local CONFIG = {
    -- URL deiner Website (ohne trailing slash)
    ApiUrl = "http://localhost:3000",
    
    -- GUI Pfad (wenn du ein ScreenGui in StarterGui hast)
    GuiPath = "StarterGui.VerificationGui",
    
    -- DataStore Key für verifizierte Spieler
    DataStoreKey = "VerifiedPlayers_"
}

-- DataStore Service
local DataStoreService = game:GetService("DataStoreService")
local VerifiedStore = DataStoreService:GetDataStore(CONFIG.DataStoreKey)

-- Funktion: Code im Spiel anzeigen (GUI)
local function createVerificationGui(player)
    -- ScreenGui erstellen
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "VerificationGui"
    screenGui.ResetOnSpawn = false
    screenGui.Parent = player:WaitForChild("PlayerGui")
    
    -- Main Frame
    local mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0, 400, 0, 300)
    mainFrame.Position = UDim2.new(0.5, -200, 0.5, -150)
    mainFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    -- Corner
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 15)
    corner.Parent = mainFrame
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 60)
    title.Position = UDim2.new(0, 0, 0, 0)
    title.BackgroundColor3 = Color3.fromRGB(50, 50, 70)
    title.BorderSizePixel = 0
    title.Text = "🔗 Account Verknüpfen"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.Font = Enum.Font.GothamBold
    title.TextSize = 24
    title.Parent = mainFrame
    
    local titleCorner = Instance.new("UICorner")
    titleCorner.CornerRadius = UDim.new(0, 15)
    titleCorner.Parent = title
    
    -- Instructions
    local instructions = Instance.new("TextLabel")
    instructions.Size = UDim2.new(1, -40, 0, 80)
    instructions.Position = UDim2.new(0, 20, 0, 70)
    instructions.BackgroundTransparency = 1
    instructions.Text = "1. Gehe auf die Website\n2. Klicke auf 'Code generieren'\n3. Gib den Code hier ein:"
    instructions.TextColor3 = Color3.fromRGB(200, 200, 200)
    instructions.Font = Enum.Font.Gotham
    instructions.TextSize = 14
    instructions.TextWrapped = true
    instructions.Parent = mainFrame
    
    -- TextBox for Code Input
    local codeInput = Instance.new("TextBox")
    codeInput.Size = UDim2.new(1, -40, 0, 50)
    codeInput.Position = UDim2.new(0, 20, 0, 160)
    codeInput.BackgroundColor3 = Color3.fromRGB(40, 40, 55)
    codeInput.BorderSizePixel = 0
    codeInput.PlaceholderText = "Code eingeben (z.B. X7K92P)"
    codeInput.PlaceholderColor3 = Color3.fromRGB(150, 150, 150)
    codeInput.TextColor3 = Color3.fromRGB(255, 255, 255)
    codeInput.Font = Enum.Font.GothamBold
    codeInput.TextSize = 24
    codeInput.TextXAlignment = Enum.TextXAlignment.Center
    codeInput.MaxLength = 6
    codeInput.Parent = mainFrame
    
    local inputCorner = Instance.new("UICorner")
    inputCorner.CornerRadius = UDim.new(0, 8)
    inputCorner.Parent = codeInput
    
    -- Verify Button
    local verifyBtn = Instance.new("TextButton")
    verifyBtn.Size = UDim2.new(1, -40, 0, 45)
    verifyBtn.Position = UDim2.new(0, 20, 0, 225)
    verifyBtn.BackgroundColor3 = Color3.fromRGB(114, 137, 218)
    verifyBtn.BorderSizePixel = 0
    verifyBtn.Text = "✅ Verifizieren"
    verifyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    verifyBtn.Font = Enum.Font.GothamBold
    verifyBtn.TextSize = 18
    verifyBtn.Parent = mainFrame
    
    local btnCorner = Instance.new("UICorner")
    btnCorner.CornerRadius = UDim.new(0, 8)
    btnCorner.Parent = verifyBtn
    
    -- Status Label
    local statusLabel = Instance.new("TextLabel")
    statusLabel.Name = "StatusLabel"
    statusLabel.Size = UDim2.new(1, -40, 0, 30)
    statusLabel.Position = UDim2.new(0, 20, 0, 270)
    statusLabel.BackgroundTransparency = 1
    statusLabel.Text = ""
    statusLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    statusLabel.Font = Enum.Font.Gotham
    statusLabel.TextSize = 14
    statusLabel.Parent = mainFrame
    
    -- Close Button
    local closeBtn = Instance.new("TextButton")
    closeBtn.Size = UDim2.new(0, 30, 0, 30)
    closeBtn.Position = UDim2.new(1, -35, 0, 5)
    closeBtn.BackgroundColor3 = Color3.fromRGB(240, 71, 71)
    closeBtn.BorderSizePixel = 0
    closeBtn.Text = "✕"
    closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeBtn.Font = Enum.Font.GothamBold
    closeBtn.TextSize = 18
    closeBtn.Parent = mainFrame
    
    local closeCorner = Instance.new("UICorner")
    closeCorner.CornerRadius = UDim.new(0, 8)
    closeCorner.Parent = closeBtn
    
    closeBtn.MouseButton1Click:Connect(function()
        screenGui:Destroy()
    end)
    
    -- Verify Button Click Handler
    verifyBtn.MouseButton1Click:Connect(function()
        local code = codeInput.Text:upper():gsub("%s", "")
        
        if #code < 6 then
            statusLabel.Text = "❌ Bitte gib einen gültigen Code ein!"
            statusLabel.TextColor3 = Color3.fromRGB(240, 71, 71)
            return
        end
        
        -- Button deaktivieren während der Anfrage
        verifyBtn.Interactable = false
        verifyBtn.Text = "⏳ Verarbeite..."
        statusLabel.Text = "Verbinde mit Server..."
        statusLabel.TextColor3 = Color3.fromRGB(250, 166, 26)
        
        -- HTTP Request senden
        local success, result = pcall(function()
            local body = HttpService:JSONEncode({
                code = code,
                robloxUserId = player.UserId
            })
            
            local response = HttpService:PostAsync(
                CONFIG.ApiUrl .. "/api/verify-code",
                body,
                Enum.HttpContentType.ApplicationJson
            )
            
            return HttpService:JSONDecode(response)
        end)
        
        if success then
            if result.success then
                -- Erfolgreich verifiziert!
                statusLabel.Text = "✅ " .. (result.message or "Account erfolgreich verknüpft!")
                statusLabel.TextColor3 = Color3.fromRGB(67, 181, 129)
                
                -- Im DataStore speichern
                pcall(function()
                    VerifiedStore:SetAsync(tostring(player.UserId), {
                        verified = true,
                        verifiedAt = os.time(),
                        robloxUserId = player.UserId
                    })
                end)
                
                -- GUI nach kurzer Zeit schließen
                wait(2)
                screenGui:Destroy()
                
                -- Hier kannst du dem Spieler Belohnungen geben
                givePlayerRewards(player)
            else
                -- Fehler vom Server
                statusLabel.Text = "❌ " .. (result.message or "Code ungültig oder bereits verwendet!")
                statusLabel.TextColor3 = Color3.fromRGB(240, 71, 71)
                verifyBtn.Interactable = true
                verifyBtn.Text = "✅ Verifizieren"
            end
        else
            -- HTTP Fehler
            warn("Verification Error:", result)
            statusLabel.Text = "❌ Verbindungsfehler!"
            statusLabel.TextColor3 = Color3.fromRGB(240, 71, 71)
            verifyBtn.Interactable = true
            verifyBtn.Text = "✅ Verifizieren"
        end
    end)
    
    return screenGui
end

-- Funktion: Belohnungen geben (anpassbar)
function givePlayerRewards(player)
    -- Hier kannst du dem Spieler Belohnungen geben
    print("Spieler " .. player.Name .. " wurde verifiziert! Belohnungen geben...")
    
    -- Beispiel: Leaderstats aktualisieren
    -- Oder spezielle Items freischalten
    -- Oder VIP-Zugang gewähren
end

-- Funktion: Prüfen ob Spieler bereits verifiziert ist
function isPlayerVerified(player)
    local success, data = pcall(function()
        return VerifiedStore:GetAsync(tostring(player.UserId))
    end)
    
    if success and data and data.verified then
        return true
    end
    
    return false
end

-- Player Added Event
game.Players.PlayerAdded:Connect(function(player)
    -- Prüfen ob Spieler bereits verifiziert ist
    if isPlayerVerified(player) then
        print("Spieler " .. player.Name .. " ist bereits verifiziert!")
        givePlayerRewards(player)
    else
        -- Optional: GUI automatisch öffnen nach kurzer Zeit
        wait(3)
        if player and player.Character then
            createVerificationGui(player)
        end
    end
end)

-- Command für Admins zum manuellen Öffnen der GUI
game.Players.PlayerChatted:Connect(function(message, player)
    if message:lower() == "/verify" then
        if not isPlayerVerified(player) then
            createVerificationGui(player)
        else
            player:Chat("Du bist bereits verifiziert! ✅")
        end
    end
end)

print("✅ Roblox Account Linking System geladen!")
print("📡 API URL: " .. CONFIG.ApiUrl)
print("💡 Verwende '/verify' im Chat um das Fenster zu öffnen")
