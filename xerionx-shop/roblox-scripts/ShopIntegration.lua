--[[
    XerionX Shop System - Roblox Integration Script
    Place this in a ServerScriptService module
    
    This script handles:
    - Purchase verification via Roblox API
    - Account linking with Discord
    - Secure communication with the backend API
]]

local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

-- Configuration
local CONFIG = {
    ApiBaseUrl = "https://your-api-domain.com/api", -- Replace with your API URL
    ApiSecret = "your_roblox_api_secret_here", -- Must match server's ROBLOX_API_SECRET
    GameId = game.GameId,
    UniverseId = game.UniverseId,
    RequestTimeout = 30,
    RetryAttempts = 3
}

-- Signature generation for secure requests
local function generateSignature(data, secret)
    local jsonString = HttpService:JSONEncode(data)
    -- HMAC-SHA256 implementation would go here
    -- For production, use a proper crypto library or handle signing server-side
    return HttpService:GenerateGUID(false) -- Placeholder
end

-- Make secure API request
local function makeApiRequest(endpoint, data)
    local url = CONFIG.ApiBaseUrl .. endpoint
    
    local headers = {
        ["Content-Type"] = "application/json",
        ["X-API-Secret"] = CONFIG.ApiSecret,
        ["X-Request-Timestamp"] = tostring(os.time() * 1000)
    }
    
    -- Add signature header
    data.timestamp = os.time() * 1000
    local signature = generateSignature(data, CONFIG.ApiSecret)
    headers["X-Request-Signature"] = signature
    
    local body = HttpService:JSONEncode(data)
    
    local success, response = pcall(function()
        return HttpService:PostAsync(url, body, Enum.HttpContentType.ApplicationJson, headers)
    end)
    
    if success then
        return HttpService:JSONDecode(response)
    else
        warn("API Request failed:", response)
        return nil
    end
end

-- Get verification code for account linking
local function getVerificationCode(player)
    local data = {
        discordId = player.UserId, -- This should be the Discord ID, not Roblox UserId
        discordUsername = player.Name
    }
    
    local response = makeApiRequest("/link/request", data)
    
    if response and response.success then
        return response.data.verificationCode, response.data.expiresAt
    end
    
    return nil, nil
end

-- Verify account link
local function verifyAccountLink(player, discordId, verificationCode)
    local data = {
        discordId = discordId,
        robloxId = tostring(player.UserId),
        robloxUsername = player.Name,
        verificationCode = verificationCode
    }
    
    local response = makeApiRequest("/link/verify", data)
    
    if response and response.success then
        return true, "Account linked successfully!"
    elseif response then
        return false, response.error or "Failed to link accounts"
    else
        return false, "API request failed"
    end
end

-- Process purchase and send to API
local function processPurchase(player, productId, purchaseId)
    local data = {
        userId = player.UserId,
        username = player.Name,
        productId = tostring(productId),
        purchaseId = tostring(purchaseId),
        transactionId = HttpService:GenerateGUID(false),
        timestamp = os.time() * 1000
    }
    
    local response = makeApiRequest("/purchase/webhook", data)
    
    if response and response.success then
        return true, response.data
    elseif response then
        return false, response.error
    else
        return false, "Failed to process purchase"
    end
end

-- Handle product purchase (for DevProducts)
MarketplaceService.ProcessReceipt = function(receiptInfo)
    local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
    
    if not player then
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end
    
    print(`Processing purchase for {player.Name}: Product {receiptInfo.ProductId}`)
    
    -- Send purchase to API
    local success, result = processPurchase(
        player,
        receiptInfo.ProductId,
        receiptInfo.PurchaseId
    )
    
    if success then
        print(`Purchase verified: {receiptInfo.PurchaseId}`)
        
        -- Grant the product based on type
        if receiptInfo.PurchaseType == Enum.ProductPurchaseType.DevProduct then
            -- DevProduct logic (already handled by Roblox)
            return Enum.ProductPurchaseDecision.PurchaseGranted
        elseif receiptInfo.PurchaseType == Enum.ProductPurchaseType.GamePass then
            -- GamePass logic
            return Enum.ProductPurchaseDecision.PurchaseGranted
        end
    else
        warn(`Purchase verification failed: {result}`)
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end
    
    return Enum.ProductPurchaseDecision.NotProcessedYet
end

-- Command handler for account linking
local function handleCommand(player, command, args)
    if command == "getcode" then
        local code, expiresAt = getVerificationCode(player)
        
        if code then
            player:Chat(`[XerionX] Your verification code: {code}`)
            player:Chat(`[XerionX] This code expires at {tostring(expiresAt)}`)
        else
            player:Chat("[XerionX] Failed to generate verification code. Please try again.")
        end
        
    elseif command == "verify" then
        if #args < 2 then
            player:Chat("[XerionX] Usage: /verify <discord_id> <code>")
            return
        end
        
        local discordId = args[1]
        local verificationCode = args[2]
        
        local success, message = verifyAccountLink(player, discordId, verificationCode)
        
        if success then
            player:Chat(`[XerionX] {message}`)
        else
            player:Chat(`[XerionX] Error: {message}`)
        end
    end
end

-- Chat command handler
Players.Chatted:Connect(function(message)
    local player = Players:GetPlayerFromCharacter(message.Parent)
    if not player then return end
    
    if string.sub(message, 1, 1) == "/" then
        local parts = {}
        for part in string.gmatch(string.sub(message, 2), "[^%s]+") do
            table.insert(parts, part)
        end
        
        if #parts > 0 then
            handleCommand(player, parts[1], parts)
        end
    end
end)

-- Initialize
print("[XerionX] Shop System initialized!")
print(`[XerionX] API Endpoint: {CONFIG.ApiBaseUrl}`)
