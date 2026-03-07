package integrations

var registry = map[Platform]IntegrationAdapter{
	PlatformOpenClaw: &OpenClawAdapter{},
}

func GetAdapter(platform Platform) (IntegrationAdapter, bool) {
	a, ok := registry[platform]
	return a, ok
}
