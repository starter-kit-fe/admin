# 获取当前时间并格式化版本号
VERSION := $(shell TZ="Asia/Shanghai" date +"%y.%m%d.%H%M")
# 默认提交消息
DEFAULT_MSG := "bump version to v$(VERSION)"
# 使用提供的消息或默认消息
MSG ?= $(DEFAULT_MSG)

# 使用纯shell命令更新版本号
update-version:
	@echo "Updating package.json version to $(VERSION)"
	@sed -i.bak 's/"version": "[^"]*"/"version": "$(VERSION)"/' package.json && rm package.json.bak

# 提交版本变更到Git，支持自定义提交消息
push-version: update-version
	@echo "Committing version change with message: $(MSG)"
	git add .
	git commit -m $(MSG)
	git push

# 创建并推送标签
push-tag: push-version
	@echo "Creating and pushing tag v$(VERSION)"
	git tag v$(VERSION)
	git push origin v$(VERSION)

# 开发命令
dev: 
	npm run dev