# Routing

Smart routing system that moves items to their proper place.

## Routes
- Inbox → Projects (if has #project tag)
- Inbox → Research (if has #research tag)
- Inbox → Trading (if has ticker symbol)
- Projects → Archive (if status: completed)

## Manual Routing
`bun scripts/route.ts <source> <destination>`