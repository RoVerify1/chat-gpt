--!strict
--[[
    XerionX - Roblox Code Redemption Script
    Place this LocalScript inside a TextButton in a ScreenGui
    
    Requirements:
    1. Enable HttpService in Game Settings (Security tab)
    2. Replace BACKEND_URL with your actual backend URL
    3. Add this button to a ScreenGui in StarterGui
]]

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")

local player = Players.LocalPlayer
local button = script.Parent -- This should be a TextButton

-- CONFIGURATION - REPLACE WITH YOUR BACKEND URL
local BACKEND_URL = "https://your-render-backend.onrender.com/api"

-- GUI References (adjust based on your GUI structure)
local screenGui = button:FindFirstAncestorWhichIsA("ScreenGui")
local resultFrame = nil

-- Create result GUI if it doesn't exist
local function createResultGUI()
    if resultFrame then return resultFrame end
    
    local frame = Instance.new("Frame")
    frame.Name = "RedeemResult"
    frame.Size = UDim2.new(0, 400, 0, 250)
    frame.Position = UDim2.new(0.5, -200, 0.5, -125)
    frame.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
    frame.BorderSizePixel = 0
    frame.Visible = false
    
    -- Background with transparency
    local bg = Instance.new("Frame")
    bg.Name = "Background"
    bg.Size = UDim2.new(1, 0, 1, 0)
    bg.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
    bg.BackgroundTransparency = 0.3
    bg.BorderSizePixel = 0
    bg.Parent = frame
    
    -- Corner radius
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 16)
    corner.Parent = bg
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(1, -40, 0, 40)
    title.Position = UDim2.new(0, 20, 0, 20)
    title.BackgroundTransparency = 1
    title.Text = "Code Redemption"
    title.TextColor3 = Color3.fromRGB(255, 106, 0)
    title.TextSize = 24
    title.Font = Enum.Font.GothamBold
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.Parent = bg
    
    -- Close button
    local closeBtn = Instance.new("TextButton")
    closeBtn.Name = "CloseButton"
    closeBtn.Size = UDim2.new(0, 30, 0, 30)
    closeBtn.Position = UDim2.new(1, -40, 0, 15)
    closeBtn.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
    closeBtn.Text = "✕"
    closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeBtn.TextSize = 20
    closeBtn.AutoButtonColor = true
    closeBtn.Parent = bg
    
    local closeCorner = Instance.new("UICorner")
    closeCorner.CornerRadius = UDim.new(0, 8)
    closeCorner.Parent = closeBtn
    
    closeBtn.MouseButton1Click:Connect(function()
        frame.Visible = false
    end)
    
    -- Message label
    local message = Instance.new("TextLabel")
    message.Name = "Message"
    message.Size = UDim2.new(1, -40, 0, 100)
    message.Position = UDim2.new(0, 20, 0, 70)
    message.BackgroundTransparency = 1
    message.Text = ""
    message.TextColor3 = Color3.fromRGB(255, 255, 255)
    message.TextSize = 16
    message.Font = Enum.Font.Gotham
    message.TextWrapped = true
    message.TextYAlignment = Enum.TextYAlignment.Top
    message.TextXAlignment = Enum.TextXAlignment.Left
    message.Parent = bg
    
    -- Download button
    local downloadBtn = Instance.new("TextButton")
    downloadBtn.Name = "DownloadButton"
    downloadBtn.Size = UDim2.new(1, -40, 0, 45)
    downloadBtn.Position = UDim2.new(0, 20, 1, -65)
    downloadBtn.BackgroundColor3 = Color3.fromRGB(255, 106, 0)
    downloadBtn.Text = "📥 Download Now"
    downloadBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    downloadBtn.TextSize = 18
    downloadBtn.Font = Enum.Font.GothamBold
    downloadBtn.Visible = false
    downloadBtn.Parent = bg
    
    local dlCorner = Instance.new("UICorner")
    dlCorner.CornerRadius = UDim.new(0, 10)
    dlCorner.Parent = downloadBtn
    
    downloadBtn.MouseButton1Click:Connect(function()
        -- Note: Roblox cannot open external links directly from scripts
        -- This will show the link for the user to copy
        local link = downloadBtn:GetAttribute("DownloadLink") or ""
        if link ~= "" then
            message.Text = "Download Link:\n\n" .. link .. "\n\n(Copy and paste into your browser)"
            downloadBtn.Text = "✓ Copied!"
            task.wait(2)
            downloadBtn.Text = "📥 Download Now"
        end
    end)
    
    frame.Parent = screenGui or player:WaitForChild("PlayerGui")
    resultFrame = frame
    return frame
end

-- Show result in GUI
local function showResult(success, message, downloadLink)
    local frame = createResultGUI()
    local messageLabel = frame:FindFirstChild("Background"):FindFirstChild("Message")
    local downloadBtn = frame:FindFirstChild("Background"):FindFirstChild("DownloadButton")
    
    if success then
        messageLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
        messageLabel.Text = "✅ Success!\n\n" .. message
        if downloadLink and downloadLink ~= "" then
            downloadBtn:SetAttribute("DownloadLink", downloadLink)
            downloadBtn.Visible = true
        else
            downloadBtn.Visible = false
        end
    else
        messageLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
        messageLabel.Text = "❌ Error\n\n" .. message
        downloadBtn.Visible = false
    end
    
    frame.Visible = true
end

-- Show loading state
local function setLoading(loading)
    if loading then
        button.Text = "⏳ Processing..."
        button.Interactable = false
    else
        button.Text = "🎁 Redeem Code"
        button.Interactable = true
    end
end

-- Request code input from player
local function promptForCode()
    local userInputService = game:GetService("UserInputService")
    local textBox = Instance.new("TextBox")
    textBox.PlaceholderText = "Enter code (XER-XXXX)"
    textBox.Size = UDim2.new(0, 300, 0, 50)
    textBox.Position = UDim2.new(0.5, -150, 0.5, -25)
    textBox.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    textBox.TextColor3 = Color3.fromRGB(255, 255, 255)
    textBox.TextSize = 18
    textBox.ClearTextOnFocus = false
    textBox.Parent = screenGui or player:WaitForChild("PlayerGui")
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 10)
    corner.Parent = textBox
    
    textBox:CaptureFocus()
    
    local code = nil
    local connection
    connection = userInputService.InputBegan:Connect(function(input, processed)
        if input.KeyCode == Enum.KeyCode.Return and not processed then
            code = textBox.Text
            textBox:ReleaseFocus()
            textBox:Destroy()
            connection:Disconnect()
        elseif input.KeyCode == Enum.KeyCode.Escape and not processed then
            textBox:ReleaseFocus()
            textBox:Destroy()
            connection:Disconnect()
        end
    end)
    
    -- Timeout after 30 seconds
    task.delay(30, function()
        if textBox.Parent then
            textBox:Destroy()
            connection:Disconnect()
        end
    end)
    
    -- Wait for input
    while not code and textBox.Parent do
        task.wait(0.1)
    end
    
    return code and code:upper() or nil
end

-- Redeem code function
local function redeemCode(code)
    if not code or code == "" then
        showResult(false, "Please enter a valid code.")
        return
    end
    
    setLoading(true)
    
    local url = BACKEND_URL .. "/redeem/" .. code
    
    local success, result = pcall(function()
        local response = HttpService:GetAsync(url)
        return HttpService:JSONDecode(response)
    end)
    
    setLoading(false)
    
    if success then
        if result.success then
            showResult(true, "You received: " .. (result.productName or "Item"), result.downloadLink)
            
            -- Also output to chat for reference
            print("✅ XerionX: Code redeemed successfully!")
            print("Product: " .. (result.productName or "Unknown"))
            print("Download Link: " .. (result.downloadLink or "N/A"))
        else
            showResult(false, result.error or "Invalid or expired code.")
        end
    else
        showResult(false, "Failed to connect to server. Please try again later.\n\nError: " .. tostring(result))
        warn("XerionX API Error:", result)
    end
end

-- Button click handler
button.MouseButton1Click:Connect(function()
    local code = promptForCode()
    if code then
        redeemCode(code)
    end
end)

-- Alternative: Auto-redeem if code is passed as argument
-- Uncomment below if you want to call redeemCode("XER-1234") from another script
-- G RedeemCode = redeemCode

print("✅ XerionX Redemption Script Loaded!")
print("Backend URL: " .. BACKEND_URL)
print("Click the button to redeem a code!")
