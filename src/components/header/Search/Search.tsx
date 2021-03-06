import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as _ from "lodash";
import * as React from "react";
import * as Autosuggest from "react-autosuggest";
import LoadingBar from "react-redux-loading-bar";
import { Redirect } from "react-router";
import { Button, Form, FormGroup, Popover, PopoverBody } from "reactstrap";
import * as Metadata from "../../../utils/Metadata";

import { AssetSchemeDoc, BlockDoc, TransactionDoc } from "codechain-indexer-types";
import { H256, U256 } from "codechain-sdk/lib/core/classes";
import {
    RequestAssetInfosByName,
    RequestAssetScheme,
    RequestAssetTransferAddressTransactions,
    RequestBlock,
    RequestPlatformAddressAccount,
    RequestTransaction
} from "../../../request";
import { ImageLoader } from "../../util/ImageLoader/ImageLoader";
import "./Search.scss";

interface State {
    inputValue: string;
    status: string;
    redirectTo?: string;
    requestCount: number;
    suggestions: { assetType: string; assetScheme: AssetSchemeDoc }[];
    searchStatusForSuggest: string;
    popoverOpen: boolean;
}

interface Props {
    className?: string;
    idString: string;
}

class Search extends React.Component<Props, State> {
    private debouncedLoadSuggestions: any;
    constructor(props: Props) {
        super(props);
        this.state = {
            status: "wait",
            inputValue: "",
            requestCount: 0,
            suggestions: [],
            searchStatusForSuggest: "wait",
            popoverOpen: false
        };
        this.debouncedLoadSuggestions = _.debounce(this.fetchAssetBundles, 500);
    }

    public componentWillReceiveProps(props: Props) {
        this.setState({
            status: "wait",
            inputValue: "",
            redirectTo: undefined,
            requestCount: 0,
            searchStatusForSuggest: "wait",
            popoverOpen: false
        });
    }

    public render() {
        const {
            inputValue,
            status,
            redirectTo,
            requestCount,
            suggestions,
            searchStatusForSuggest,
            popoverOpen
        } = this.state;
        const inputProps = {
            placeholder: "Block / Tx / Asset / Address",
            value: inputValue,
            onChange: this.updateInputValue
        };
        return (
            <Form inline={true} onSubmit={this.handleSumbit} className={`search-form d-flex ${this.props.className}`}>
                <FormGroup className="mb-0 search-form-group d-flex">
                    <div className="search-input d-inline-block" id={`suggest-input-container-${this.props.idString}`}>
                        <Autosuggest
                            suggestions={suggestions}
                            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                            getSuggestionValue={this.getSuggestionValue}
                            renderSuggestion={this.renderSuggestion}
                            inputProps={inputProps}
                        />
                        <LoadingBar scope="searchBar" className="search-loading-bar" />
                    </div>
                </FormGroup>
                <Button className="btn btn-primary search-summit" type="submit">
                    <span className="search-big">Search</span>
                    <span className="search-small">
                        <FontAwesomeIcon icon={faSearch} />
                    </span>
                </Button>
                {status === "search" ? (
                    <div>
                        <RequestBlock
                            progressBarTarget="searchBar"
                            id={inputValue}
                            onBlock={this.onBlock}
                            onBlockNotExist={this.onReqeustNotExist}
                            onError={this.onError}
                        />
                        <RequestTransaction
                            progressBarTarget="searchBar"
                            hash={inputValue}
                            onTransaction={this.onTransaction}
                            onTransactionNotExist={this.onReqeustNotExist}
                            onError={this.onError}
                        />
                        <RequestAssetScheme
                            progressBarTarget="searchBar"
                            assetType={inputValue}
                            onAssetScheme={this.onAssetScheme}
                            onAssetSchemeNotExist={this.onReqeustNotExist}
                            onError={this.onError}
                        />
                        <RequestPlatformAddressAccount
                            progressBarTarget="searchBar"
                            address={inputValue}
                            onAccount={this.onAccount}
                            onAccountNotExist={this.onReqeustNotExist}
                            onError={this.onError}
                        />
                        <RequestAssetTransferAddressTransactions
                            progressBarTarget="searchBar"
                            page={1}
                            itemsPerPage={1}
                            address={inputValue}
                            onTransactions={this.onTransactionsForAssetTransferAddress}
                            onError={this.onError}
                        />
                    </div>
                ) : null}
                {requestCount === 0 && redirectTo ? <Redirect push={true} to={redirectTo} /> : null}
                {searchStatusForSuggest === "search" ? (
                    <RequestAssetInfosByName
                        assetName={inputValue}
                        onSearchResponse={this.onSearchAssetResponse}
                        onError={this.onSearchError}
                    />
                ) : null}
                <Popover
                    placement="bottom"
                    className="search-error-pop"
                    isOpen={popoverOpen}
                    target={`suggest-input-container-${this.props.idString}`}
                    toggle={this.togglePopover}
                >
                    <PopoverBody>There are no search results.</PopoverBody>
                </Popover>
            </Form>
        );
    }

    private togglePopover = () => {
        this.setState({
            popoverOpen: !this.state.popoverOpen
        });
    };

    private onSearchError = (e: any) => {
        console.log(e);
    };

    private onSearchAssetResponse = (searchAssetResponse: { assetType: string; assetScheme: AssetSchemeDoc }[]) => {
        this.setState({
            suggestions: searchAssetResponse,
            searchStatusForSuggest: "wait"
        });
    };

    private onBlock = (block: BlockDoc) => {
        this.cancelOtherRequest();
        this.setState({
            redirectTo: `/block/${block.number}`,
            requestCount: this.state.requestCount - 1
        });
    };

    private onTransaction = (transaction: TransactionDoc) => {
        this.cancelOtherRequest();
        this.setState({
            redirectTo: `/tx/0x${transaction.hash}`,
            requestCount: this.state.requestCount - 1
        });
    };

    private onAssetScheme = (asset: AssetSchemeDoc, assetType: string) => {
        this.cancelOtherRequest();
        this.setState({
            redirectTo: `/asset/${assetType}`,
            requestCount: this.state.requestCount - 1
        });
    };

    private onTransactionsForAssetTransferAddress = (transactions: TransactionDoc[], address: string) => {
        if (transactions.length > 0) {
            this.cancelOtherRequest();
            this.setState({
                redirectTo: `/addr-asset/${address}`,
                requestCount: this.state.requestCount - 1
            });
        } else {
            this.handleNotFoundOrError();
        }
    };

    private onAccount = (account: { seq: U256; balance: U256 }, address: string) => {
        this.cancelOtherRequest();
        this.setState({
            redirectTo: `/addr-platform/${address}`,
            requestCount: this.state.requestCount - 1
        });
    };

    private cancelOtherRequest = () => {
        // TODO
    };

    private onReqeustNotExist = () => {
        this.handleNotFoundOrError();
    };

    private onError = (e: any) => {
        this.handleNotFoundOrError();
    };

    private handleNotFoundOrError = () => {
        const requestCount = this.state.requestCount - 1;
        if (requestCount === 0) {
            this.setState({ requestCount, popoverOpen: true, status: "wait" });
        } else {
            this.setState({ requestCount });
        }
    };

    private updateInputValue = (e: any, value: any) => {
        this.setState({
            inputValue: value.newValue
        });
    };

    private onSuggestionsFetchRequested = (request: { value: string; reason: any }) => {
        if (this.state.searchStatusForSuggest === "search" && request.reason !== "input-changed") {
            return;
        }
        this.debouncedLoadSuggestions();
    };

    private fetchAssetBundles() {
        if (!this.state.inputValue || this.state.inputValue.trim() === "") {
            return;
        }
        this.setState({
            searchStatusForSuggest: "search"
        });
    }

    private renderSuggestion = (suggestion: { assetType: string; assetScheme: AssetSchemeDoc }) => (
        <div>
            <ImageLoader className="icon" size={20} data={new H256(suggestion.assetType).value} isAssetImage={true} />
            <span className="name">{Metadata.parseMetadata(suggestion.assetScheme.metadata).name}</span>
        </div>
    );

    private getSuggestionValue = (suggestion: { assetType: string; assetScheme: AssetSchemeDoc }) => {
        return `0x${suggestion.assetType}`;
    };

    private onSuggestionsClearRequested = () => {
        this.setState({
            suggestions: []
        });
    };

    private handleSumbit = (e: any) => {
        e.preventDefault();
        if (this.state.status === "search") {
            return;
        }
        const inputValue = this.state.inputValue.trim();
        if (inputValue === "") {
            return;
        }
        if (this.state.suggestions.length > 0) {
            const firstSuggestion = this.state.suggestions[0];
            this.setState({ status: "search", requestCount: 8, inputValue: firstSuggestion.assetType });
        } else {
            this.setState({ status: "search", requestCount: 8, inputValue });
        }
    };
}

export default Search;
