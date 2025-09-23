from web3 import Web3
import re
from typing import Optional, Tuple

class ENSResolver:
    def __init__(self, web3_provider_url: str = "https://mainnet.infura.io/v3/e801704be72e482eba2a8086b42d82f5"):
        """
        Initialize ENS resolver with Web3 provider
        Note: You'll need to set up your own Infura key or Ethereum node
        """
        self.w3 = Web3(Web3.HTTPProvider(web3_provider_url))

    def is_ens_name(self, name: str) -> bool:
        """
        Check if a string is a valid ENS name (contains .eth or other TLD)
        """
        # Basic ENS name pattern: alphanumeric, hyphens, dots, ending with .eth or other TLDs
        ens_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.eth$'
        return bool(re.match(ens_pattern, name.lower()))

    def is_wallet_address(self, address: str) -> bool:
        """
        Check if a string is a valid Ethereum wallet address
        """
        return self.w3.is_address(address)

    def resolve_ens_name(self, ens_name: str) -> Optional[str]:
        """
        Resolve ENS name to Ethereum address
        Returns None if resolution fails
        """
        try:
            if not self.is_ens_name(ens_name):
                return None

            # Use web3's built-in ENS resolver
            address = self.w3.ens.address(ens_name)
            return address if address else None

        except Exception as e:
            print(f"ENS resolution error for {ens_name}: {e}")
            return None

    def reverse_resolve_address(self, address: str) -> Optional[str]:
        """
        Reverse resolve Ethereum address to ENS name
        Returns None if no ENS name is found
        """
        try:
            if not self.is_wallet_address(address):
                return None

            # Use web3's reverse ENS resolution
            ens_name = self.w3.ens.name(address)
            return ens_name if ens_name else None

        except Exception as e:
            print(f"Reverse ENS resolution error for {address}: {e}")
            return None

    def resolve_identifier(self, identifier: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Resolve any identifier (ENS name or wallet address) to wallet address and ENS name
        Returns: (wallet_address, ens_name)
        """
        identifier = identifier.strip().lower()

        # If it's already a wallet address
        if self.is_wallet_address(identifier):
            ens_name = self.reverse_resolve_address(identifier)
            return identifier, ens_name

        # If it's an ENS name
        elif self.is_ens_name(identifier):
            wallet_address = self.resolve_ens_name(identifier)
            return wallet_address, identifier if wallet_address else None

        # Neither valid address nor ENS name
        else:
            return None, None

# Global ENS resolver instance
# Note: In production, configure with your own Infura key
ens_resolver = ENSResolver()

def resolve_to_wallet_address(identifier: str) -> Optional[str]:
    """
    Convenience function to resolve any identifier to wallet address
    """
    address, _ = ens_resolver.resolve_identifier(identifier)
    return address

def get_display_name(identifier: str) -> str:
    """
    Get the best display name for an identifier (ENS name if available, otherwise truncated address)
    """
    address, ens_name = ens_resolver.resolve_identifier(identifier)

    if ens_name:
        return ens_name
    elif address:
        # Return truncated address
        return f"{address[:6]}...{address[-4:]}"
    else:
        return identifier