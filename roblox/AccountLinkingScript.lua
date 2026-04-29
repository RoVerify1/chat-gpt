--[[
    Roblox Account Linking & Item Redemption System
    Vollständiges GUI + Script für Roblox Studio
    
    ANLEITUNG:
    1. Erstelle ein ScreenGui in StarterGui
    2. Füge dieses Script als Child von ScreenGui hinzu
    3. Aktiviere HttpService in Game Settings -> Security
    4. Ersetze API_URL mit deiner Website URL
]]

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")

-- KONFIGURATION
local API_URL = "http://localhost:3000" -- ÄNDERN ZU DEINER LIVE URL
local PLAYER = Players.LocalPlayer

-- GUI ERSTELLUNG (Automatisch)
local function createGui()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "AccountLinkingGUI"
    screenGui.ResetOnSpawn = false
    screenGui.Parent = PLAYER:WaitForChild("PlayerGui")
    
    -- Main Frame
    local mainFrame = Instance.new("Frame")
    mainFrame.Name = "MainFrame"
    mainFrame.Size = UDim2.new(0, 400, 0, 500)
    mainFrame.Position = UDim2.new(0.5, -200, 0.5, -250)
    mainFrame.BackgroundColor3 = Color3.fromRGB(26, 26, 36)
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    -- Corner
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 15)
    corner.Parent = mainFrame
    
    -- Stroke
    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(108, 92, 231)
    stroke.Thickness = 2
    stroke.Parent = mainFrame
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(1, 0, 0, 60)
    title.Position = UDim2.new(0, 0, 0, 0)
    title.BackgroundColor3 = Color3.fromRGB(108, 92, 231)
    title.BorderSizePixel = 0
    title.Text = "🎮 Roblox Shop"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.Font = Enum.Font.GothamBold
    title.TextSize = 24
    title.Parent = mainFrame
    
    local titleCorner = Instance.new("UICorner")
    titleCorner.CornerRadius = UDim.new(0, 15)
    titleCorner.Parent = title
    
    -- Tab Container
    local tabContainer = Instance.new("Frame")
    tabContainer.Name = "TabContainer"
    tabContainer.Size = UDim2.new(1, -20, 0, 40)
    tabContainer.Position = UDim2.new(0, 10, 0, 70)
    tabContainer.BackgroundTransparency = 1
    tabContainer.Parent = mainFrame
    
    -- Tabs
    local tabs = {"Link Account", "Redeem Item"}
    local tabButtons = {}
    
    for i, tabName in ipairs(tabs) do
        local btn = Instance.new("TextButton")
        btn.Name = tabName
        btn.Size = UDim2.new(0.5, -5, 1, 0)
        btn.Position = UDim2.new((i-1) * 0.5, 0, 0, 0)
        btn.BackgroundColor3 = Color3.fromRGB(37, 37, 48)
        btn.BorderSizePixel = 0
        btn.Text = tabName
        btn.TextColor3 = Color3.fromRGB(160, 160, 176)
        btn.Font = Enum.Font.GothamBold
        btn.TextSize = 14
        btn.Parent = tabContainer
        
        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 8)
        btnCorner.Parent = btn
        
        table.insert(tabButtons, btn)
        
        btn.MouseButton1Click:Connect(function()
            for _, b in ipairs(tabButtons) do
                b.BackgroundColor3 = Color3.fromRGB(37, 37, 48)
                b.TextColor3 = Color3.fromRGB(160, 160, 176)
            end
            btn.BackgroundColor3 = Color3.fromRGB(108, 92, 231)
            btn.TextColor3 = Color3.fromRGB(255, 255, 255)
            
            -- Show corresponding page
            mainFrame:FindFirstChild("LinkPage").Visible = (tabName == "Link Account")
            mainFrame:FindFirstChild("RedeemPage").Visible = (tabName == "Redeem Item")
        end)
    end
    
    -- Set first tab active
    tabButtons[1].BackgroundColor3 = Color3.fromRGB(108, 92, 231)
    tabButtons[1].TextColor3 = Color3.fromRGB(255, 255, 255)
    
    -- LINK ACCOUNT PAGE
    local linkPage = Instance.new("Frame")
    linkPage.Name = "LinkPage"
    linkPage.Size = UDim2.new(1, -40, 0, 300)
    linkPage.Position = UDim2.new(0, 20, 0, 120)
    linkPage.BackgroundTransparency = 1
    linkPage.Visible = true
    linkPage.Parent = mainFrame
    
    local linkLabel = Instance.new("TextLabel")
    linkLabel.Parent = linkPage
    linkLabel.Size = UDim2.new(1, 0, 0, 30)
    linkLabel.BackgroundTransparency = 1
    linkLabel.Text = "Enter this code on the website:"
    linkLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    linkLabel.Font = Enum.Font.Gotham
    linkLabel.TextSize = 14
    
    local generateBtn = Instance.new("TextButton")
    generateBtn.Name = "GenerateBtn"
    generateBtn.Parent = linkPage
    generateBtn.Size = UDim2.new(1, 0, 0, 50)
    generateBtn.Position = UDim2.new(0, 0, 0, 50)
    generateBtn.BackgroundColor3 = Color3.fromRGB(108, 92, 231)
    generateBtn.BorderSizePixel = 0
    generateBtn.Text = "📋 Generate Code"
    generateBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    generateBtn.Font = Enum.Font.GothamBold
    generateBtn.TextSize = 16
    
    local genCorner = Instance.new("UICorner")
    genCorner.CornerRadius = UDim.new(0, 10)
    genCorner.Parent = generateBtn
    
    local codeDisplay = Instance.new("Frame")
    codeDisplay.Name = "CodeDisplay"
    codeDisplay.Parent = linkPage
    codeDisplay.Size = UDim2.new(1, 0, 0, 80)
    codeDisplay.Position = UDim2.new(0, 0, 0, 120)
    codeDisplay.BackgroundColor3 = Color3.fromRGB(37, 37, 48)
    codeDisplay.BorderSizePixel = 0
    codeDisplay.Visible = false
    
    local displayCorner = Instance.new("UICorner")
    displayCorner.CornerRadius = UDim.new(0, 10)
    displayCorner.Parent = codeDisplay
    
    local codeLabel = Instance.new("TextLabel")
    codeLabel.Name = "CodeLabel"
    codeLabel.Parent = codeDisplay
    codeLabel.Size = UDim2.new(1, 0, 1, 0)
    codeLabel.BackgroundTransparency = 1
    codeLabel.Text = "------"
    codeLabel.TextColor3 = Color3.fromRGB(0, 206, 201)
    codeLabel.Font = Enum.Font.GothamBold
    codeLabel.TextSize = 32
    codeLabel.TextScaled = true
    
    local statusLabel = Instance.new("TextLabel")
    statusLabel.Name = "StatusLabel"
    statusLabel.Parent = linkPage
    statusLabel.Size = UDim2.new(1, 0, 0, 30)
    statusLabel.Position = UDim2.new(0, 0, 0, 210)
    statusLabel.BackgroundTransparency = 1
    statusLabel.Text = ""
    statusLabel.TextColor3 = Color3.fromRGB(0, 184, 148)
    statusLabel.Font = Enum.Font.GothamBold
    statusLabel.TextSize = 14
    
    -- REDEEM ITEM PAGE
    local redeemPage = Instance.new("Frame")
    redeemPage.Name = "RedeemPage"
    redeemPage.Size = UDim2.new(1, -40, 0, 300)
    redeemPage.Position = UDim2.new(0, 20, 0, 120)
    redeemPage.BackgroundTransparency = 1
    redeemPage.Visible = false
    redeemPage.Parent = mainFrame
    
    local redeemLabel = Instance.new("TextLabel")
    redeemLabel.Parent = redeemPage
    redeemLabel.Size = UDim2.new(1, 0, 0, 30)
    redeemLabel.BackgroundTransparency = 1
    redeemLabel.Text = "Enter your item code from website:"
    redeemLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    redeemLabel.Font = Enum.Font.Gotham
    redeemLabel.TextSize = 14
    
    local codeBox = Instance.new("TextBox")
    codeBox.Name = "CodeBox"
    codeBox.Parent = redeemPage
    codeBox.Size = UDim2.new(1, 0, 0, 50)
    codeBox.Position = UDim2.new(0, 0, 0, 40)
    codeBox.BackgroundColor3 = Color3.fromRGB(37, 37, 48)
    codeBox.BorderSizePixel = 0
    codeBox.PlaceholderText = "ITEM-XXXXXX"
    codeBox.PlaceholderColor3 = Color3.fromRGB(160, 160, 176)
    codeBox.Text = ""
    codeBox.TextColor3 = Color3.fromRGB(255, 255, 255)
    codeBox.Font = Enum.Font.GothamBold
    codeBox.TextSize = 20
    codeBox.ClearTextOnFocus = false
    
    local boxCorner = Instance.new("UICorner")
    boxCorner.CornerRadius = UDim.new(0, 10)
    boxCorner.Parent = codeBox
    
    local redeemBtn = Instance.new("TextButton")
    redeemBtn.Name = "RedeemBtn"
    redeemBtn.Parent = redeemPage
    redeemBtn.Size = UDim2.new(1, 0, 0, 50)
    redeemBtn.Position = UDim2.new(0, 0, 0, 100)
    redeemBtn.BackgroundColor3 = Color3.fromRGB(0, 206, 201)
    redeemBtn.BorderSizePixel = 0
    redeemBtn.Text = "✅ Redeem Item"
    redeemBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    redeemBtn.Font = Enum.Font.GothamBold
    redeemBtn.TextSize = 16
    
    local redeemCorner = Instance.new("UICorner")
    redeemCorner.CornerRadius = UDim.new(0, 10)
    redeemCorner.Parent = redeemBtn
    
    local redeemStatus = Instance.new("TextLabel")
    redeemStatus.Name = "RedeemStatus"
    redeemStatus.Parent = redeemPage
    redeemStatus.Size = UDim2.new(1, 0, 0, 30)
    redeemStatus.Position = UDim2.new(0, 0, 0, 160)
    redeemStatus.BackgroundTransparency = 1
    redeemStatus.Text = ""
    redeemStatus.TextColor3 = Color3.fromRGB(255, 255, 255)
    redeemStatus.Font = Enum.Font.GothamBold
    redeemStatus.TextSize = 14
    redeemStatus.TextWrapped = true
    
    -- Toggle Button (Bottom Right)
    local toggleBtn = Instance.new("TextButton")
    toggleBtn.Name = "ToggleBtn"
    toggleBtn.Size = UDim2.new(0, 40, 0, 40)
    toggleBtn.Position = UDim2.new(1, -50, 1, -50)
    toggleBtn.BackgroundColor3 = Color3.fromRGB(108, 92, 231)
    toggleBtn.BorderSizePixel = 0
    toggleBtn.Text = "🛒"
    toggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    toggleBtn.Font = Enum.Font.GothamBold
    toggleBtn.TextSize = 20
    toggleBtn.Parent = screenGui
    
    local toggleCorner = Instance.new("UICorner")
    toggleCorner.CornerRadius = UDim.new(0, 20)
    toggleCorner.Parent = toggleBtn
    
    toggleBtn.MouseButton1Click:Connect(function()
        mainFrame.Visible = not mainFrame.Visible
        toggleBtn.Text = mainFrame.Visible and "❌" or "🛒"
    end)
    
    -- GENERATE CODE BUTTON LOGIC
    generateBtn.MouseButton1Click:Connect(function()
        generateBtn.Text = "⏳ Loading..."
        generateBtn.Interactable = false
        
        pcall(function()
            local response = HttpService:PostAsync(
                API_URL .. "/api/generate-link-code",
                HttpService:JSONEncode({}),
                Enum.HttpContentType.ApplicationJson
            )
            
            local data = HttpService:JSONDecode(response)
            
            if data.success then
                codeDisplay.Visible = true
                codeLabel.Text = data.code
                
                -- Poll for verification
                spawn(function()
                    local verified = false
                    for i = 1, 60 do -- Check for 5 minutes (every 5 sec)
                        wait(5)
                        
                        local statusResponse = HttpService:GetAsync(
                            API_URL .. "/api/status/" .. data.code
                        )
                        local statusData = HttpService:JSONDecode(statusResponse)
                        
                        if statusData.linked then
                            statusLabel.Text = "✅ Account linked successfully!"
                            verified = true
                            
                            -- Add to leaderstats
                            local leaderstats = PLAYER:FindFirstChild("leaderstats")
                            if not leaderstats then
                                leaderstats = Instance.new("Folder")
                                leaderstats.Name = "leaderstats"
                                leaderstats.Parent = PLAYER
                            end
                            
                            local verifiedStat = leaderstats:FindFirstChild("Verified")
                            if not verifiedStat then
                                verifiedStat = Instance.new("BoolValue")
                                verifiedStat.Name = "Verified"
                                verifiedStat.Value = true
                                verifiedStat.Parent = leaderstats
                            end
                            
                            break
                        end
                    end
                    
                    if not verified then
                        statusLabel.Text = "⏰ Code expired. Generate a new one."
                    end
                end)
            else
                statusLabel.Text = "❌ Error: " .. data.message
                statusLabel.TextColor3 = Color3.fromRGB(255, 118, 117)
            end
        end)
        
        generateBtn.Text = "📋 Generate Code"
        generateBtn.Interactable = true
    end)
    
    -- REDEEM BUTTON LOGIC
    redeemBtn.MouseButton1Click:Connect(function()
        local code = codeBox.Text
        if #code < 5 then
            redeemStatus.Text = "❌ Please enter a valid code"
            redeemStatus.TextColor3 = Color3.fromRGB(255, 118, 117)
            return
        end
        
        redeemBtn.Text = "⏳ Loading..."
        redeemBtn.Interactable = false
        
        pcall(function()
            local response = HttpService:PostAsync(
                API_URL .. "/api/redeem-item",
                HttpService:JSONEncode({
                    code = code,
                    robloxUserId = PLAYER.UserId
                }),
                Enum.HttpContentType.ApplicationJson
            )
            
            local data = HttpService:JSONDecode(response)
            
            if data.success then
                redeemStatus.Text = "✅ " .. data.message
                redeemStatus.TextColor3 = Color3.fromRGB(0, 184, 148)
                
                -- Give item based on modelId
                giveItemToPlayer(data.modelId)
                
                codeBox.Text = ""
            else
                redeemStatus.Text = "❌ " .. data.message
                redeemStatus.TextColor3 = Color3.fromRGB(255, 118, 117)
            end
        end)
        
        redeemBtn.Text = "✅ Redeem Item"
        redeemBtn.Interactable = true
    end)
    
    return screenGui
end

-- ITEM GIVING FUNCTION
function giveItemToPlayer(modelId)
    -- HIER KANNST DU DIE ITEMS GEBEN
    -- Beispiel:
    
    if modelId == "SwordModel" then
        -- Gib Schwert
        local sword = Instance.new("Tool")
        sword.Name = "Neon Sword"
        sword.Parent = PLAYER.Backpack
    elseif modelId == "VIPBadge" then
        -- Gib VIP Badge
        local badge = Instance.new("BoolValue")
        badge.Name = "VIP"
        badge.Parent = PLAYER
    elseif modelId == "SpeedGear" then
        -- Gib Speed Boost
        local speed = Instance.new("NumberValue")
        speed.Name = "SpeedBoost"
        speed.Value = 1.5
        speed.Parent = PLAYER
    end
    
    -- ODER: Asset von ID laden
    -- local asset = game.ServerStorage:FindFirstChild(modelId)
    -- if asset then asset:Clone().Parent = PLAYER.Backpack end
end

-- START
createGui()
