import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Luv2ShopFormService} from "../../services/luv2-shop-form.service";
import {Country} from "../../common/country";
import {State} from 'src/app/common/state';
import {state} from '@angular/animations';
import {Luv2ShopValidators} from "../../validators/luv2-shop-validators";
import {CartService} from "../../services/cart.service";
import {Router} from "@angular/router";
import {CheckoutService} from "../../services/checkout.service";
import {Order} from "../../common/order";
import {OrderItem} from "../../common/order-item";
import {Purchase} from 'src/app/common/purchase';
import {environment} from "../../../environments/environment";
import {PaymentInfo} from "../../common/payment-info";
import {error} from '@angular/compiler/src/util';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup: FormGroup;

  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[] = [];

  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  // initialize stripe api
  stripe = Stripe(environment.stripPublishKey);
  paymentInfo: PaymentInfo = new PaymentInfo();
  cardElement: any;
  displayError: any = "";

  isDisabled: boolean = false;


  constructor(private router: Router, private checkOutService: CheckoutService, private cartService: CartService, private formBuilder: FormBuilder, private luv2ShopFormService: Luv2ShopFormService) {
  }

  ngOnInit(): void {

    this.setupStripePaymentForm();

    this.reviewCartDetails();

    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhiteSpace]),
        lastName: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhiteSpace]),
        email: new FormControl('', [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhiteSpace]),
        city: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhiteSpace]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhiteSpace])
      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhiteSpace]),
        city: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhiteSpace]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhiteSpace])

      }),
      creditCard: this.formBuilder.group({
        // cardType: new FormControl('', [Validators.required]),
        // nameOnCard: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhiteSpace]),
        // cardNumber: new FormControl('', [Validators.required, Validators.pattern('[0-9]{16}'), Validators.maxLength(16)]),
        // securityCode: new FormControl('', [Validators.required, Validators.pattern('[0-9]{3}'), Validators.maxLength(3)]),
        // expirationDateMonth: [''],
        // expirationDateYear: ['']
      }),


    });
    // //poluate credit card month
    // const startMonth: number = new Date().getMonth() + 1;
    // console.log("startMonth", startMonth);
    //
    // this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
    //   data => {
    //     this.creditCardMonths = data;
    //   }
    // );
    //
    //
    // //populate credit card years
    //
    // this.luv2ShopFormService.getCreditCardYears().subscribe(
    //   data => {
    //     this.creditCardYears = data
    //   }
    // );

    //populate Countries
    this.luv2ShopFormService.getCountries().subscribe(
      data => {
        this.countries = data
      }
    )


  }

  onSubmit() {
    console.log("Handling the submit button");

    if (this.checkoutFormGroup.invalid) {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    // set up order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    // get cart items
    const cartItems = this.cartService.cartItems;

    // create orderItems from cartItems
    // - long way
    /*
    let orderItems: OrderItem[] = [];
    for (let i=0; i < cartItems.length; i++) {
      orderItems[i] = new OrderItem(cartItems[i]);
    }
    */

    // - short way of doing the same thingy
    let orderItems: OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));

    // set up purchase
    let purchase = new Purchase();

    // populate purchase - customer
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;

    // populate purchase - shipping address
    purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingState: State = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    // populate purchase - billing address
    purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
    const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress.state));
    const billingCountry: Country = JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;

    // populate purchase - order and orderItems
    purchase.order = order;
    purchase.orderItems = orderItems;

    // compute payment info
    this.paymentInfo.amount = Math.round(this.totalPrice * 100);
    this.paymentInfo.currency = "USD";

    // if valid form then
    // - create payment intent
    // - confirm card payment
    // - place order

    if (!this.checkoutFormGroup.invalid && this.displayError.textContent === "") {

      this.isDisabled = true
      this.checkOutService.createPaymentIntent(this.paymentInfo).subscribe(
        (paymentIntentResponse) => {
          this.stripe.confirmCardPayment(paymentIntentResponse.client_secret,
            {
              payment_method: {
                card: this.cardElement,
                billing_details:{
                  email: purchase.customer.email,
                  name:`${purchase.customer.firstName} ${purchase.customer.lastName}`,
                  address:{
                    line1: purchase.billingAddress.street,
                    city: purchase.billingAddress.city,
                    state: purchase.billingAddress.state,
                    postal_code: purchase.billingAddress.zipCode,
                    country: this.billingAddressCountry.value.code
                  }
                }
              }
            }, {handleActions: false})
            .then(function (result) {
              if (result.error) {
                // inform the customer there was an error
                alert(`There was an error: ${result.error.message}`);
                this.isDisabled=false
              } else {
                // call REST API via the CheckoutService
                this.checkOutService.placeOrder(purchase).subscribe({
                  next: response => {
                    alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);

                    // reset cart
                    this.resetCart();
                    this.isDisabled = false
                  },
                  error: err => {
                    alert(`There was an error: ${err.message}`);
                    this.isDisabled = false;
                  }
                })
              }
            }.bind(this));
        }
      );
    } else {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

  }

  get firstName() {
    return this.checkoutFormGroup.get('customer.firstName')
  }

  get lastName() {
    return this.checkoutFormGroup.get('customer.lastName')
  }

  get email() {
    return this.checkoutFormGroup.get('customer.email')
  }


  get shippingAddressStreet() {
    return this.checkoutFormGroup.get('shippingAddress.street')
  }

  get shippingAddressCity() {
    return this.checkoutFormGroup.get('shippingAddress.city')
  }

  get shippingAddressState() {
    return this.checkoutFormGroup.get('shippingAddress.state')
  }

  get shippingAddressZipCode() {
    return this.checkoutFormGroup.get('shippingAddress.zipCode')
  }

  get shippingAddressCountry() {
    return this.checkoutFormGroup.get('shippingAddress.country')
  }


  get billingAddressStreet() {
    return this.checkoutFormGroup.get('billingAddress.street')
  }

  get billingAddressCity() {
    return this.checkoutFormGroup.get('billingAddress.city')
  }

  get billingAddressState() {
    return this.checkoutFormGroup.get('billingAddress.state')
  }

  get billingAddressZipCode() {
    return this.checkoutFormGroup.get('billingAddress.zipCode')
  }

  get billingAddressCountry() {
    return this.checkoutFormGroup.get('billingAddress.country')
  }

  get creditCardType() {
    return this.checkoutFormGroup.get('creditCard.cardType')
  }

  get creditCardNameOnCard() {
    return this.checkoutFormGroup.get('creditCard.nameOnCard')
  }

  get creditCardNumber() {
    return this.checkoutFormGroup.get('creditCard.cardNumber')
  }

  get creditCardSecurityCode() {
    return this.checkoutFormGroup.get('creditCard.securityCode')
  }


  copyShippingAddressToBillingAddress(event) {
    if (event.target.checked) {
      this.checkoutFormGroup.controls['billingAddress']
        .setValue(this.checkoutFormGroup.controls['shippingAddress'].value)

      //bug fix for states

      this.billingAddressStates = this.shippingAddressStates

    } else {
      this.checkoutFormGroup.controls['billingAddress'].reset();

      this.billingAddressStates = [];
    }
  }

  handleMonthAndYears() {
    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');

    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(creditCardFormGroup.value.expirationDateYear);


    // if the current year equal the selected year, then start with the cureeent monthy

    let startMonth: number;

    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    } else {
      startMonth = 1;
    }
    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        this.creditCardMonths = data;
      }
    )


  }

  getStates(formGroupName: string) {
    const formGroup = this.checkoutFormGroup.get(formGroupName);

    const countryCode = formGroup.value.country.code;
    const countryName = formGroup.value.country.name;

    console.log(`${formGroupName} country code : ${countryCode}`);
    console.log(`${formGroupName} country code : ${countryName}`);


    this.luv2ShopFormService.getStates(countryCode).subscribe(
      data => {
        if (formGroupName === 'shippingAddress') {
          this.shippingAddressStates = data;
        } else {
          this.billingAddressStates = data;
        }

        //select first item by default

        formGroup.get('state').setValue(data[0])


      }
    );
  }

  private reviewCartDetails() {

    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity
    )

    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice = totalPrice)

  }

  private resetCart() {

    //reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    this.cartService.persistCartItems()


    //reset the form
    this.checkoutFormGroup.reset();

    // navigate back to the product page
    this.router.navigateByUrl("/products")
  }

  setupStripePaymentForm() {
    // get a handle to stripe elements
    var elements = this.stripe.elements();

    //create a card element
    this.cardElement = elements.create('card', {hidePostalCode: true});

    //add an instance of card ui components to into the card element div
    this.cardElement.mount('#card-element')
    // add event binding for the change event on the card element
    this.cardElement.on('change', (event) => {

      // get  a handle to card error eleemnts
      this.displayError = document.getElementById('card-errors');

      if (event.complete) {
        this.displayError.textContent = "";
      } else if (event.error) {
        // show validation error to the customer
        this.displayError.textContent = event.error.message;
      }

    })

  }
}
